//! Tauri commands for managing collections.

use crate::domain::collection::{Collection, CollectionUpdate};
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn create_collection(
    name: String,
    icon: Option<String>,
    color: Option<String>,
    state: State<'_, AppState>,
) -> Result<Collection, AppError> {
    state.collection_service.create_collection(name, icon, color)
}

#[tauri::command]
pub fn list_collections(state: State<'_, AppState>) -> Result<Vec<Collection>, AppError> {
    state.collection_service.list_collections()
}

#[tauri::command]
pub fn update_collection(
    id: i64,
    update: CollectionUpdate,
    state: State<'_, AppState>,
) -> Result<Collection, AppError> {
    state.collection_service.update_collection(id, update)
}

#[tauri::command]
pub fn delete_collection(id: i64, state: State<'_, AppState>) -> Result<(), AppError> {
    state.collection_service.delete_collection(id)
}

#[tauri::command]
pub fn assign_clip_to_collection(
    clip_id: i64,
    collection_id: i64,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.collection_service.assign_clip_to_collection(clip_id, collection_id)
}

#[tauri::command]
pub fn remove_clip_from_collection(
    clip_id: i64,
    collection_id: i64,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    state.collection_service.remove_clip_from_collection(clip_id, collection_id)
}

#[tauri::command]
pub fn get_collections_for_clip(
    clip_id: i64,
    state: State<'_, AppState>,
) -> Result<Vec<Collection>, AppError> {
    state.collection_service.get_collections_for_clip(clip_id)
}
