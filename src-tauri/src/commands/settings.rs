//! Settings IPC commands.

use crate::error::AppError;
use crate::state::AppState;
use std::collections::HashMap;
use tauri::State;

/// Get all application settings as a key-value map.
#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<HashMap<String, String>, AppError> {
    let pairs = state.settings_service.get_all()?;
    Ok(pairs.into_iter().collect())
}

/// Update a single setting.
#[tauri::command]
pub fn update_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), AppError> {
    state.settings_service.set(&key, &value)
}
