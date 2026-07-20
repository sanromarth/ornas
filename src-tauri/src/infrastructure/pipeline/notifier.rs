//! Stage 7: Notifier — emit Tauri events to update the frontend.
//!
//! Emits a `clip-created` event with the clip ID so the frontend
//! can invalidate its TanStack Query cache and show the new item.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use tauri::AppHandle;
use tauri::Emitter;

/// Stage 7: Notifies the frontend of a newly created clip.
///
/// Uses the Tauri event system to emit a `clip-created` event.
/// The frontend `useTauriEvent` hook listens for this and
/// invalidates the clipboard list query.
pub struct Notifier {
    app_handle: AppHandle,
}

impl Notifier {
    /// Creates a new Notifier with the given Tauri app handle.
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }
}

impl PipelineStage for Notifier {
    fn name(&self) -> &'static str {
        "notifier"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        if let Some(id) = item.assigned_id {
            self.app_handle
                .emit("clip-created", serde_json::json!({ "id": id }))
                .map_err(|e| {
                    AppError::Internal(format!("Failed to emit clip-created event: {e}"))
                })?;

            tracing::info!(stage = self.name(), id = id, "clip-created event emitted");
        }

        Ok(StageAction::Continue)
    }
}
