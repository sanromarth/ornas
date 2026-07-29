//! Clipboard IPC commands — list, get, delete, favorite, pin.
//!
//! These are thin Tauri `#[command]` handlers that validate input
//! and delegate to the clipboard service. No business logic here.

use crate::domain::clip::{Clip, FilterCounts};
use crate::domain::traits::ListParams;
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

/// List clipboard items with optional filtering and pagination.
#[tauri::command(rename_all = "snake_case")]
#[allow(clippy::too_many_arguments)]
pub fn list_clips(
    state: State<'_, AppState>,
    limit: Option<u32>,
    cursor_pinned: Option<bool>,
    cursor_created_at: Option<i64>,
    cursor_id: Option<i64>,
    category: Option<String>,
    content_type: Option<String>,
    is_code: Option<bool>,
    favorites_only: Option<bool>,
    pinned_only: Option<bool>,
    collection_id: Option<i64>,
    tag_id: Option<i64>,
) -> Result<Vec<Clip>, AppError> {
    let params = ListParams {
        limit: limit.unwrap_or(50),
        cursor_pinned,
        cursor_created_at,
        cursor_id,
        category,
        content_type,
        is_code,
        favorites_only: favorites_only.unwrap_or(false),
        pinned_only: pinned_only.unwrap_or(false),
        collection_id,
        tag_id,
    };

    state.clipboard_service.list(&params)
}

/// Get aggregated counts for sidebar smart filters.
#[tauri::command]
pub fn get_filter_counts(state: State<'_, AppState>) -> Result<FilterCounts, AppError> {
    state.clipboard_service.get_filter_counts()
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

/// Delete multiple clips by ID.
#[tauri::command]
pub fn bulk_delete_clips(state: State<'_, AppState>, ids: Vec<i64>) -> Result<(), AppError> {
    state.clipboard_service.bulk_delete(&ids)
}

/// Set the favorite status for multiple clips.
#[tauri::command]
pub fn bulk_set_favorite(
    state: State<'_, AppState>,
    ids: Vec<i64>,
    favorite: bool,
) -> Result<(), AppError> {
    state.clipboard_service.bulk_set_favorite(&ids, favorite)
}

/// Set the pinned status for multiple clips.
#[tauri::command]
pub fn bulk_set_pinned(
    state: State<'_, AppState>,
    ids: Vec<i64>,
    pinned: bool,
) -> Result<(), AppError> {
    state.clipboard_service.bulk_set_pinned(&ids, pinned)
}

/// Set the language of a clip manually.
#[tauri::command]
pub fn set_clip_language(
    state: State<'_, AppState>,
    id: i64,
    language: Option<String>,
    language_source: String,
) -> Result<Clip, AppError> {
    state
        .clipboard_service
        .update_clip_language(id, language, language_source)
}

/// Restore file paths to the system clipboard.
#[tauri::command]
pub fn restore_files_to_clipboard(
    state: State<'_, AppState>,
    clip_id: i64,
) -> Result<(), AppError> {
    let clip = state.clipboard_service.get(clip_id)?;
    if clip.content_type != crate::domain::clip::ContentType::File {
        return Err(AppError::Clipboard("Clip is not a file list".into()));
    }

    if let Some(files) = clip.files {
        let mut paths = Vec::new();
        for f in files {
            if std::path::Path::new(&f.file_path).exists() {
                paths.push(f.file_path);
            }
        }

        if paths.is_empty() {
            return Err(AppError::Clipboard(
                "No valid files found to restore".into(),
            ));
        }

        state
            .platform
            .clipboard()
            .write_files(paths)
            .map_err(AppError::Clipboard)?;

        Ok(())
    } else {
        Err(AppError::Clipboard(
            "No files associated with this clip".into(),
        ))
    }
}

/// Restore image to the system clipboard.
#[tauri::command]
pub fn restore_image_to_clipboard(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    clip_id: i64,
) -> Result<(), AppError> {
    let clip = state.clipboard_service.get(clip_id)?;
    if clip.content_type != crate::domain::clip::ContentType::Image {
        return Err(AppError::Clipboard("Clip is not an image".into()));
    }

    if let Some(image_path) = clip.image_path {
        use tauri::Manager;
        let base_path = app_handle
            .path()
            .app_data_dir()
            .map_err(|_| AppError::Internal("Failed to resolve app data directory".into()))?
            .join("images");
        let full_path = base_path.join(image_path);

        if !full_path.exists() {
            return Err(AppError::Clipboard("Image file not found".into()));
        }

        state
            .platform
            .clipboard()
            .write_image(&full_path)
            .map_err(AppError::Clipboard)?;

        Ok(())
    } else {
        Err(AppError::Clipboard(
            "No image path associated with this clip".into(),
        ))
    }
}

/// Write text directly to the system clipboard.
/// Bypasses webview limitations.
#[tauri::command]
pub fn write_text_to_clipboard(state: State<'_, AppState>, text: String) -> Result<(), AppError> {
    state
        .platform
        .clipboard()
        .write_text(&text)
        .map_err(AppError::Clipboard)?;
    Ok(())
}
