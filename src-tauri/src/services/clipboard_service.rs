//! Clipboard service — business logic for clip operations.
//!
//! Orchestrates clip CRUD operations, pruning, and event emission.
//! Delegates all database access to repository implementations.

use crate::domain::clip::{Clip, ClipUpdate};
use crate::domain::config::AppConfig;
use crate::domain::traits::{ClipRepository, ListParams};
use crate::error::AppError;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// Service layer for clipboard operations.
///
/// Contains business logic that coordinates between
/// the repository layer and the Tauri event system.
pub struct ClipboardService {
    clip_repo: Arc<dyn ClipRepository>,
    #[allow(dead_code)]
    config: AppConfig,
    app_handle: AppHandle,
}

impl ClipboardService {
    /// Creates a new clipboard service.
    pub fn new(
        clip_repo: Arc<dyn ClipRepository>,
        config: AppConfig,
        app_handle: AppHandle,
    ) -> Self {
        Self {
            clip_repo,
            config,
            app_handle,
        }
    }

    /// Lists clips with pagination and filtering.
    pub fn list(&self, params: &ListParams) -> Result<Vec<Clip>, AppError> {
        self.clip_repo.list(params)
    }

    /// Gets a single clip by ID.
    pub fn get(&self, id: i64) -> Result<Clip, AppError> {
        self.clip_repo
            .get_by_id(id)?
            .ok_or_else(|| AppError::NotFound(format!("Clip {id} not found")))
    }

    /// Deletes a clip and emits a `clip-deleted` event.
    pub fn delete(&self, id: i64) -> Result<(), AppError> {
        self.clip_repo.delete(id)?;
        self.app_handle
            .emit("clip-deleted", serde_json::json!({ "id": id }))
            .map_err(|e| AppError::Internal(format!("Failed to emit event: {e}")))?;
        tracing::info!(id = id, "clip deleted");
        Ok(())
    }

    /// Toggles the favorite status of a clip and emits a `clip-updated` event.
    pub fn toggle_favorite(&self, id: i64) -> Result<Clip, AppError> {
        let clip = self.get(id)?;
        let new_fav = !clip.is_favorite;
        self.clip_repo.set_favorite(id, new_fav)?;

        let updated = self.clip_repo.update(
            id,
            &ClipUpdate {
                is_favorite: Some(new_fav),
                is_pinned: None,
                language: None,
                language_source: None,
                ..Default::default()
            },
        )?;

        self.app_handle
            .emit("clip-updated", serde_json::json!({ "id": id }))
            .map_err(|e| AppError::Internal(format!("Failed to emit event: {e}")))?;

        tracing::debug!(id = id, favorite = new_fav, "favorite toggled");
        Ok(updated)
    }

    /// Toggles the pinned status of a clip and emits a `clip-updated` event.
    pub fn toggle_pin(&self, id: i64) -> Result<Clip, AppError> {
        let clip = self.get(id)?;
        let new_pin = !clip.is_pinned;
        self.clip_repo.set_pinned(id, new_pin)?;

        let updated = self.clip_repo.update(
            id,
            &ClipUpdate {
                is_favorite: None,
                is_pinned: Some(new_pin),
                language: None,
                language_source: None,
                ..Default::default()
            },
        )?;

        self.app_handle
            .emit("clip-updated", serde_json::json!({ "id": id }))
            .map_err(|e| AppError::Internal(format!("Failed to emit event: {e}")))?;

        tracing::debug!(id = id, pinned = new_pin, "pin toggled");
        Ok(updated)
    }

    /// Updates the language of a clip and emits a `clip-updated` event.
    pub fn update_clip_language(&self, id: i64, language: Option<String>, language_source: String) -> Result<Clip, AppError> {
        let updated = self.clip_repo.update(
            id,
            &ClipUpdate {
                is_favorite: None,
                is_pinned: None,
                language: language.clone(),
                language_source: Some("manual".to_string()),
                ..Default::default()
            },
        )?;

        self.app_handle
            .emit("clip-updated", serde_json::json!({ "id": id }))
            .map_err(|e| AppError::Internal(format!("Failed to emit event: {e}")))?;

        tracing::debug!(id = id, language_source, "language updated");
        Ok(updated)
    }

    /// Prunes old clips based on retention policy.
    ///
    /// Removes non-favorite, non-pinned clips older than the configured
    /// retention period. Called periodically by the background scheduler.
    #[allow(dead_code)]
    pub fn prune(&self) -> Result<u64, AppError> {
        let max_age = self.config.retention_secs();
        let deleted = self.clip_repo.prune_older_than(max_age)?;
        if deleted > 0 {
            tracing::info!(
                count = deleted,
                retention_days = self.config.retention_days,
                "clips pruned"
            );
        }
        Ok(deleted)
    }

    /// Returns the total number of clips in the database.
    #[allow(dead_code)]
    pub fn count(&self) -> Result<u64, AppError> {
        self.clip_repo.count()
    }
}
