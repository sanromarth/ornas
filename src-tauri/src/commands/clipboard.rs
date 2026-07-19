//! Clipboard IPC commands — list, get, delete, favorite, pin.
//!
//! These are thin Tauri `#[command]` handlers that validate input
//! and delegate to the clipboard service. No business logic here.

use crate::domain::clip::Clip;
use crate::error::AppError;

/// List clipboard items with optional filtering and pagination.
#[tauri::command]
pub fn list_clips(
    limit: Option<u32>,
    offset: Option<u32>,
    category: Option<String>,
    favorites_only: Option<bool>,
    pinned_only: Option<bool>,
) -> Result<Vec<Clip>, AppError> {
    let _ = (limit, offset, category, favorites_only, pinned_only);
    // Will delegate to ClipboardService in Milestone 1.
    Ok(Vec::new())
}

/// Get a single clip by ID.
#[tauri::command]
pub fn get_clip(id: i64) -> Result<Option<Clip>, AppError> {
    let _ = id;
    Ok(None)
}

/// Delete a clip by ID.
#[tauri::command]
pub fn delete_clip(id: i64) -> Result<(), AppError> {
    let _ = id;
    Ok(())
}

/// Toggle the favorite status of a clip.
#[tauri::command]
pub fn toggle_favorite(id: i64) -> Result<(), AppError> {
    let _ = id;
    Ok(())
}

/// Toggle the pinned status of a clip.
#[tauri::command]
pub fn toggle_pin(id: i64) -> Result<(), AppError> {
    let _ = id;
    Ok(())
}
