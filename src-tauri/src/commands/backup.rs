use crate::error::AppError;
use crate::state::AppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn export_backup(
    path: String,
    _state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    // Note: To use BackupManager, we can instantiate it on the fly or add it to AppState.
    // For simplicity, we instantiate it here since it's a rare operation.
    // Wait, let's extract the db and image store path.

    // Create DB ref
    let db = std::sync::Arc::new(crate::infrastructure::database::Database::new(
        crate::infrastructure::database::connection::open_database(
            &crate::infrastructure::database::connection::database_path()?,
        )?,
    ));

    let db_path = crate::infrastructure::database::connection::database_path()?;
    let images_dir = db_path
        .parent()
        .map(|p| p.join("images"))
        .unwrap_or_else(|| PathBuf::from("images"));

    let backup_manager = crate::services::backup_manager::BackupManager::new(db, images_dir);
    backup_manager.export(&PathBuf::from(path), app_handle)?;
    Ok(())
}

#[tauri::command]
pub async fn import_backup(
    path: String,
    mode: String,
    _state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    let db = std::sync::Arc::new(crate::infrastructure::database::Database::new(
        crate::infrastructure::database::connection::open_database(
            &crate::infrastructure::database::connection::database_path()?,
        )?,
    ));

    let db_path = crate::infrastructure::database::connection::database_path()?;
    let images_dir = db_path
        .parent()
        .map(|p| p.join("images"))
        .unwrap_or_else(|| PathBuf::from("images"));

    let backup_manager = crate::services::backup_manager::BackupManager::new(db, images_dir);
    backup_manager.import(&PathBuf::from(path), &mode, app_handle)?;
    Ok(())
}
