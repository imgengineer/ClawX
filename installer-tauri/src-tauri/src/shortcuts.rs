#[cfg(any(target_os = "windows", target_os = "linux"))]
use std::fs;
use std::path::Path;
#[cfg(target_os = "linux")]
use std::path::PathBuf;

#[cfg(any(target_os = "windows", target_os = "linux"))]
fn io_error(message: impl Into<String>) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::Other, message.into())
}

pub fn create_shortcuts(target_dir: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        create_windows_shortcuts(target_dir)
            .map_err(|error| format!("Failed to create Windows shortcuts: {error}"))?;
    }

    #[cfg(target_os = "linux")]
    {
        create_linux_shortcuts(target_dir)
            .map_err(|error| format!("Failed to create Linux shortcuts: {error}"))?;
    }

    #[cfg(target_os = "macos")]
    {
        let _ = target_dir;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn create_windows_shortcuts(target_dir: &Path) -> std::io::Result<()> {
    use mslnk::ShellLink;

    let executable = crate::os_utils::resolve_launch_target(target_dir).map_err(io_error)?;
    let targets = [
        std::env::var("USERPROFILE").ok().map(|user_profile| {
            Path::new(&user_profile).join("Desktop").join("ClawMate.lnk")
        }),
        std::env::var("APPDATA").ok().map(|app_data| {
            Path::new(&app_data)
                .join("Microsoft")
                .join("Windows")
                .join("Start Menu")
                .join("Programs")
                .join("ClawMate.lnk")
        }),
    ];

    for link_path in targets.into_iter().flatten() {
        if let Some(parent_dir) = link_path.parent() {
            fs::create_dir_all(parent_dir)?;
        }

        let mut shortcut = ShellLink::new(&executable).map_err(io_error)?;
        shortcut.set_name(Some("ClawMate".to_string()));
        shortcut.set_working_dir(Some(target_dir.to_string_lossy().into_owned()));
        shortcut.set_icon_location(Some(executable.to_string_lossy().into_owned()));
        shortcut.create_lnk(&link_path).map_err(io_error)?;
    }

    Ok(())
}

#[cfg(target_os = "linux")]
fn create_linux_shortcuts(target_dir: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;

    let executable = crate::os_utils::resolve_launch_target(target_dir).map_err(io_error)?;
    let home_dir =
        PathBuf::from(std::env::var("HOME").map_err(|_| io_error("Missing HOME environment variable"))?);
    let desktop_paths = [
        home_dir.join(".local").join("share").join("applications").join("clawmate.desktop"),
        home_dir.join("Desktop").join("clawmate.desktop"),
    ];

    let icon_path = resolve_linux_icon(target_dir)
        .unwrap_or_else(|| executable.clone())
        .to_string_lossy()
        .into_owned();
    let executable_path = escape_desktop_value(&executable.to_string_lossy());
    let try_exec_path = executable.to_string_lossy();
    let working_dir = target_dir.to_string_lossy();
    let desktop_entry = format!(
        "[Desktop Entry]\nType=Application\nVersion=1.0\nName=ClawMate\nComment=AI Assistant powered by OpenClaw\nExec={executable_path}\nTryExec={try_exec_path}\nPath={working_dir}\nIcon={icon_path}\nTerminal=false\nCategories=Utility;Network;\nStartupWMClass=clawx\n"
    );

    for desktop_file in desktop_paths {
        if let Some(parent_dir) = desktop_file.parent() {
            fs::create_dir_all(parent_dir)?;
        }
        fs::write(&desktop_file, &desktop_entry)?;
        fs::set_permissions(&desktop_file, fs::Permissions::from_mode(0o755))?;
    }

    Ok(())
}

#[cfg(target_os = "linux")]
fn escape_desktop_value(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

#[cfg(target_os = "linux")]
fn resolve_linux_icon(target_dir: &Path) -> Option<PathBuf> {
    let candidates = [
        target_dir.join("resources").join("resources").join("icons").join("32x32.png"),
        target_dir.join("resources").join("resources").join("icons").join("128x128.png"),
        target_dir.join("resources").join("icons").join("32x32.png"),
        target_dir.join("resources").join("icons").join("128x128.png"),
    ];

    candidates.into_iter().find(|path| path.exists())
}
