use crate::error::AppError;
use crate::platform::models::{DiagnosticsInfo, PlatformInfo};
use crate::state::AppState;
use tauri::State;

/// Get detailed platform information.
#[tauri::command]
pub fn get_platform_info(state: State<'_, AppState>) -> Result<PlatformInfo, AppError> {
    Ok(state.platform.info().clone())
}

/// Get runtime health diagnostics.
#[tauri::command]
pub fn get_diagnostics_info(state: State<'_, AppState>) -> Result<DiagnosticsInfo, AppError> {
    Ok(state.platform.diagnostics())
}
