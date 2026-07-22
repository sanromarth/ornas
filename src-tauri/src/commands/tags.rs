//! Tauri commands for managing tags.

use crate::domain::tag::{Tag, TagUpdate};
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn create_tag(
    name: String,
    color: Option<String>,
    state: State<'_, AppState>,
) -> Result<Tag, AppError> {
    state.tag_service.create_tag(name, color)
}

#[tauri::command]
pub fn list_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, AppError> {
    state.tag_service.list_tags()
}

#[tauri::command]
pub fn update_tag(
    id: i64,
    update: TagUpdate,
    state: State<'_, AppState>,
) -> Result<Tag, AppError> {
    state.tag_service.update_tag(id, update)
}

#[tauri::command]
pub fn delete_tag(id: i64, state: State<'_, AppState>) -> Result<(), AppError> {
    state.tag_service.delete_tag(id)
}

#[tauri::command]
pub fn assign_clip_to_tag(
    clip_id: i64,
    tag_id: i64,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.tag_service.assign_clip_to_tag(clip_id, tag_id)
}

#[tauri::command]
pub fn remove_clip_from_tag(
    clip_id: i64,
    tag_id: i64,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.tag_service.remove_clip_from_tag(clip_id, tag_id)
}

#[tauri::command]
pub fn get_tags_for_clip(
    clip_id: i64,
    state: State<'_, AppState>,
) -> Result<Vec<Tag>, AppError> {
    state.tag_service.get_tags_for_clip(clip_id)
}
