use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// Manually run a database integrity check.
#[tauri::command]
pub fn run_integrity_check(state: State<'_, AppState>) -> Result<String, AppError> {
    let conn = state.db.conn()?;
    let result: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(e.to_string()))?;

    if result.to_lowercase() != "ok" {
        return Err(AppError::Database(format!(
            "Integrity check failed: {}",
            result
        )));
    }

    Ok(result)
}

/// Export diagnostic logs to a zip file on the desktop.
#[tauri::command]
pub fn export_diagnostics(_state: State<'_, AppState>) -> Result<String, AppError> {
    // We will implement full export_diagnostics later.
    Ok("OK".to_string())
}
