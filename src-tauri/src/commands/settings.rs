//! Settings IPC commands.

use crate::error::AppError;
use std::collections::HashMap;

/// Get all application settings as a key-value map.
#[tauri::command]
pub fn get_settings() -> Result<HashMap<String, String>, AppError> {
    // Will delegate to SettingsService in Milestone 1.
    Ok(HashMap::new())
}

/// Update a single setting.
#[tauri::command]
pub fn update_setting(key: String, value: String) -> Result<(), AppError> {
    let _ = (key, value);
    Ok(())
}
