use std::fs::{self, File};
use std::io::{self, BufWriter};
use std::path::{Path, PathBuf};

use tauri::Emitter;
use tauri::Manager;
use zip::read::ZipArchive;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    percentage: u8,
    processed_files: usize,
    total_files: usize,
    current_file: String,
}

fn resolve_payload_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        for bundled_payload in [
            resource_dir.join("resources").join("payload.zip"),
            resource_dir.join("payload.zip"),
        ] {
            if bundled_payload.exists() {
                return Ok(bundled_payload);
            }
        }
    }

    #[cfg(debug_assertions)]
    {
        let manifest_payload = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join("payload.zip");

        if manifest_payload.exists() {
            return Ok(manifest_payload);
        }
    }

    Err(
        "Missing installer payload.zip. Release builds should contain Contents/Resources/resources/payload.zip, and development builds can fall back to installer-tauri/src-tauri/resources/payload.zip."
            .to_string(),
    )
}

fn emit_progress(
    app: &tauri::AppHandle,
    processed_files: usize,
    total_files: usize,
    current_file: String,
) {
    let percentage = if total_files == 0 {
        100
    } else {
        ((processed_files as f32 / total_files as f32) * 100.0)
            .round()
            .clamp(0.0, 100.0) as u8
    };

    let _ = app.emit(
        "install-progress",
        ProgressPayload {
            percentage,
            processed_files,
            total_files,
            current_file,
        },
    );
}

fn extract_payload_archive(
    app: &tauri::AppHandle,
    payload_path: &Path,
    target_dir: &Path,
) -> Result<(), String> {
    let file = File::open(payload_path)
        .map_err(|error| format!("Failed to open installer payload {}: {error}", payload_path.display()))?;
    let mut archive = ZipArchive::new(file)
        .map_err(|error| format!("Failed to read installer payload archive: {error}"))?;
    let total_files = archive.len();

    if total_files == 0 {
        return Err("Installer payload archive is empty".to_string());
    }

    emit_progress(app, 0, total_files, "Preparing files...".to_string());

    for index in 0..total_files {
        let mut entry = archive
            .by_index(index)
            .map_err(|error| format!("Failed to access archive entry #{index}: {error}"))?;

        let relative_path = entry
            .enclosed_name()
            .map(|path| path.to_path_buf())
            .ok_or_else(|| format!("Archive entry contains an invalid path: {}", entry.name()))?;
        let destination = target_dir.join(&relative_path);

        if entry.is_dir() {
            fs::create_dir_all(&destination).map_err(|error| {
                format!("Failed to create directory {}: {error}", destination.display())
            })?;
        } else {
            if let Some(parent_dir) = destination.parent() {
                fs::create_dir_all(parent_dir).map_err(|error| {
                    format!("Failed to create directory {}: {error}", parent_dir.display())
                })?;
            }

            let output_file = File::create(&destination)
                .map_err(|error| format!("Failed to create {}: {error}", destination.display()))?;
            let mut writer = BufWriter::new(output_file);
            io::copy(&mut entry, &mut writer)
                .map_err(|error| format!("Failed to extract {}: {error}", destination.display()))?;

            #[cfg(unix)]
            if let Some(mode) = entry.unix_mode() {
                use std::os::unix::fs::PermissionsExt;

                fs::set_permissions(&destination, fs::Permissions::from_mode(mode)).map_err(
                    |error| format!("Failed to apply permissions to {}: {error}", destination.display()),
                )?;
            }
        }

        emit_progress(
            app,
            index + 1,
            total_files,
            relative_path.display().to_string(),
        );
    }

    Ok(())
}

#[tauri::command]
pub async fn start_installation(
    app: tauri::AppHandle,
    target_dir: String,
    create_shortcut: bool,
) -> Result<(), String> {
    let target_path = Path::new(&target_dir);
    if target_path.as_os_str().is_empty() {
        return Err("Installation path cannot be empty".to_string());
    }

    fs::create_dir_all(target_path)
        .map_err(|error| format!("Failed to create target directory {}: {error}", target_path.display()))?;

    let payload_path = resolve_payload_path(&app)?;
    extract_payload_archive(&app, &payload_path, target_path)?;

    if create_shortcut {
        crate::shortcuts::create_shortcuts(target_path)?;
    }

    Ok(())
}
