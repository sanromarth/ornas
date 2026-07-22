//! Search IPC commands.

use crate::domain::clip::Clip;
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// Search clipboard items using FTS5 full-text search.
#[tauri::command]
pub fn search_clips(
    state: State<'_, AppState>,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<Clip>, AppError> {
    state.search_service.search(&query, limit.unwrap_or(50))
}
