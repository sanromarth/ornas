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
    category: Option<String>,
    favorites_only: Option<bool>,
    pinned_only: Option<bool>,
    collection_id: Option<i64>,
    tag_id: Option<i64>,
) -> Result<Vec<Clip>, AppError> {
    let params = crate::domain::traits::ListParams {
        limit: limit.unwrap_or(50),
        offset: 0,
        category,
        favorites_only: favorites_only.unwrap_or(false),
        pinned_only: pinned_only.unwrap_or(false),
        collection_id,
        tag_id,
    };
    state.search_service.search(&query, params.limit, &params)
}
