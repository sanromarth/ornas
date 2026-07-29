use crate::error::AppError;
use crate::state::AppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn validate_backup(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<crate::services::backup_manager::Manifest, AppError> {
    state
        .backup_manager
        .validate_backup(&std::path::PathBuf::from(path))
}

#[tauri::command]
pub async fn export_backup(
    path: String,
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    state
        .backup_manager
        .export(&PathBuf::from(path), app_handle)?;
    Ok(())
}

#[tauri::command]
pub async fn import_backup(
    path: String,
    mode: String,
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    state
        .backup_manager
        .import(&PathBuf::from(path), &mode, app_handle)?;
    Ok(())
}
