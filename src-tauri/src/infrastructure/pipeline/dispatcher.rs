//! Stage 8: Dispatcher — emit UI events and schedule background jobs.
//!
//! The dispatcher is the final pipeline stage. It has two responsibilities:
//!
//! 1. **Notify the frontend** — emit `clip-created` so the UI shows the clip
//!    immediately after persistence.
//!
//! 2. **Schedule background work** — dispatch `BackgroundJob`s to the job queue
//!    for deferred processing (e.g., image save + thumbnail generation).
//!
//! These responsibilities are deliberately co-located in one stage because
//! they must both execute after persistence and before the pipeline returns.
//! However, the Dispatcher does NOT perform the background work itself —
//! it only *schedules* it.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use crate::infrastructure::pipeline::job_queue::{BackgroundJob, ImageJob, JobQueue};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// Stage 8: Notifies the UI and dispatches background jobs.
///
/// Replaces the previous `Notifier` stage with additional responsibility
/// for scheduling deferred work via the `JobQueue`.
pub struct Dispatcher {
    app_handle: AppHandle,
    job_queue: Arc<JobQueue>,
}

impl Dispatcher {
    /// Creates a new Dispatcher with the given Tauri app handle and job queue.
    pub fn new(app_handle: AppHandle, job_queue: Arc<JobQueue>) -> Self {
        Self {
            app_handle,
            job_queue,
        }
    }
}

impl PipelineStage for Dispatcher {
    fn name(&self) -> &'static str {
        "dispatcher"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        let Some(id) = item.assigned_id else {
            tracing::warn!(stage = self.name(), "no assigned_id — skipping dispatch");
            return Ok(StageAction::Continue);
        };

        // Notify UI immediately so the user sees the new clip
        self.app_handle
            .emit("clip-created", serde_json::json!({ "id": id }))
            .map_err(|e| AppError::Internal(format!("Failed to emit clip-created event: {e}")))?;

        tracing::info!(stage = self.name(), id = id, "clip-created event emitted");

        // Schedule async background work (e.g. image processing)

        // Image processing: save to filesystem + generate thumbnail
        if let Some(image_bytes) = item.image_bytes.take() {
            self.job_queue.enqueue(BackgroundJob::Image(ImageJob {
                clip_id: id,
                content_hash: item.content_hash.clone(),
                image_bytes,
            }));
            tracing::info!(
                stage = self.name(),
                id = id,
                "ImageJob dispatched to background queue"
            );
        }

        // Future background jobs would be dispatched here:
        // if needs_ocr(item) {
        //     self.job_queue.enqueue(BackgroundJob::Ocr(OcrJob { clip_id: id, ... }));
        // }

        Ok(StageAction::Continue)
    }
}
