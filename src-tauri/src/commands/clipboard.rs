//! Clipboard IPC commands — list, get, delete, favorite, pin.
//!
//! These are thin Tauri `#[command]` handlers that validate input
//! and delegate to the clipboard service. No business logic here.

use crate::domain::clip::Clip;
use crate::domain::traits::ListParams;
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// List clipboard items with optional filtering and pagination.
#[tauri::command]
pub fn list_clips(
    state: State<'_, AppState>,
    limit: Option<u32>,
    offset: Option<u32>,
    category: Option<String>,
    favorites_only: Option<bool>,
    pinned_only: Option<bool>,
) -> Result<Vec<Clip>, AppError> {
    let params = ListParams {
        limit: limit.unwrap_or(50),
        offset: offset.unwrap_or(0),
        category,
        favorites_only: favorites_only.unwrap_or(false),
        pinned_only: pinned_only.unwrap_or(false),
    };
    state.clipboard_service.list(&params)
}

/// Get a single clip by ID.
#[tauri::command]
pub fn get_clip(state: State<'_, AppState>, id: i64) -> Result<Clip, AppError> {
    state.clipboard_service.get(id)
}

/// Delete a clip by ID.
#[tauri::command]
pub fn delete_clip(state: State<'_, AppState>, id: i64) -> Result<(), AppError> {
    state.clipboard_service.delete(id)
}

/// Toggle the favorite status of a clip.
#[tauri::command]
pub fn toggle_favorite(state: State<'_, AppState>, id: i64) -> Result<Clip, AppError> {
    state.clipboard_service.toggle_favorite(id)
}

/// Toggle the pinned status of a clip.
#[tauri::command]
pub fn toggle_pin(state: State<'_, AppState>, id: i64) -> Result<Clip, AppError> {
    state.clipboard_service.toggle_pin(id)
}
