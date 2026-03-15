mod install;
mod os_utils;
mod shortcuts;

use std::process::Command;

#[tauri::command]
fn launch_app(target_dir: String) -> Result<(), String> {
    let target_path = std::path::PathBuf::from(&target_dir);
    let launch_target = os_utils::resolve_launch_target(&target_path)?;

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut command = Command::new("open");
        command.arg(&launch_target);
        command
    };

    #[cfg(not(target_os = "macos"))]
    let mut command = {
        let mut command = Command::new(&launch_target);
        command.current_dir(&target_path);
        command
    };

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to launch installed app: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            os_utils::get_default_install_dir,
            install::start_installation,
            launch_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
