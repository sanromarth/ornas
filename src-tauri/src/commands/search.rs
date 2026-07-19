//! Search IPC commands.

use crate::domain::clip::Clip;
use crate::error::AppError;

/// Search clipboard items using FTS5 full-text search.
#[tauri::command]
pub fn search_clips(query: String, limit: Option<u32>) -> Result<Vec<Clip>, AppError> {
    let _ = (query, limit);
    // Will delegate to SearchService in Milestone 1.
    Ok(Vec::new())
}
