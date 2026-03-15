use std::ffi::OsStr;
use std::path::{Path, PathBuf};

#[tauri::command]
pub fn get_default_install_dir() -> Result<String, String> {
    default_install_dir().map(|path| path.to_string_lossy().into_owned())
}

pub fn default_install_dir() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            return Ok(Path::new(&local_app_data).join("Programs").join("ClawMate"));
        }
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            return Ok(Path::new(&user_profile)
                .join("AppData")
                .join("Local")
                .join("Programs")
                .join("ClawMate"));
        }
        Err("Could not determine Windows LOCALAPPDATA directory".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(home_dir) = std::env::var("HOME") {
            return Ok(Path::new(&home_dir).join("Applications").join("ClawMate.app"));
        }
        Err("Could not determine macOS HOME directory".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home_dir) = std::env::var("HOME") {
            return Ok(Path::new(&home_dir)
                .join(".local")
                .join("lib")
                .join("ClawMate"));
        }
        Err("Could not determine Linux HOME directory".to_string())
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Unsupported operating system".to_string())
    }
}

pub fn resolve_launch_target(target_dir: &Path) -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path = target_dir.join("ClawMate.exe");
        return if exe_path.exists() {
            Ok(exe_path)
        } else {
            Err(format!("Could not find ClawMate.exe in {}", target_dir.display()))
        };
    }

    #[cfg(target_os = "macos")]
    {
        if target_dir.extension() == Some(OsStr::new("app")) && target_dir.exists() {
            return Ok(target_dir.to_path_buf());
        }

        let bundled_app = target_dir.join("ClawMate.app");
        return if bundled_app.exists() {
            Ok(bundled_app)
        } else {
            Err(format!("Could not find ClawMate.app in {}", target_dir.display()))
        };
    }

    #[cfg(target_os = "linux")]
    {
        for candidate in ["ClawMate", "clawmate", "AppRun"] {
            let executable_path = target_dir.join(candidate);
            if executable_path.exists() {
                return Ok(executable_path);
            }
        }

        Err(format!(
            "Could not find a Linux executable in {}",
            target_dir.display()
        ))
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Unsupported operating system".to_string())
    }
}
