//! Stage 7: Persister — write clip to SQLite (fast path only).
//!
//! Converts a pipeline `ClipItem` into a `NewClip` and persists it
//! via the clip repository.
//!
//! **No image I/O happens here.** Image bytes remain on the `ClipItem`
//! and are dispatched to the background `JobQueue` by the `Dispatcher`
//! stage that follows. This keeps the critical clipboard path fast.

use crate::domain::clip::{ContentType, NewClip};
use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::domain::traits::ClipRepository;
use crate::error::AppError;
use std::sync::Arc;
use std::time::Instant;

/// Stage 7: Persists the processed clip to the database.
///
/// Performs only the database INSERT. For image clips, `image_path`
/// is set to `None` — the background `ImageJob` will update it later
/// after saving the image and generating a thumbnail.
pub struct Persister {
    clip_repo: Arc<dyn ClipRepository>,
}

impl Persister {
    /// Creates a new Persister with the given clip repository.
    pub fn new(clip_repo: Arc<dyn ClipRepository>) -> Self {
        Self { clip_repo }
    }
}

impl PipelineStage for Persister {
    fn name(&self) -> &'static str {
        "persister"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        // NOTE: image_bytes are NOT processed here.
        // They remain on ClipItem for the Dispatcher to take() and
        // dispatch to the background ImageJob worker.

        let content_type = match item.content_type.as_str() {
            "image" => ContentType::Image,
            "rich_text" => ContentType::RichText,
            "file" => ContentType::File,
            _ => ContentType::Text,
        };

        // For image clips, image_path is None — it will be set by
        // the background ImageJob after saving the image to disk.
        let new_clip = NewClip {
            content_text: item.content_text.take(),
            content_html: item.content_html.take(),
            content_rtf: item.content_rtf.take(),
            image_path: None,
            content_type,
            category: std::mem::take(&mut item.category),
            source_app: item.source_app.take(),
            content_hash: item.content_hash.clone(),
            preview: item.preview.take(),
            char_count: item.char_count,
            line_count: item.line_count,
            language: item.language.take(),
            is_code: item.is_code,
            detection_confidence: item.detection_confidence,
            language_source: std::mem::take(&mut item.language_source),
            is_encrypted: false,
            encryption_version: None,
            encrypted_blob: None,
            nonce: None,
            metadata: item.metadata.clone(),
        };

        let db_start = Instant::now();
        let created = self.clip_repo.create(&new_clip)?;
        let db_elapsed = db_start.elapsed();
        item.assigned_id = Some(created.id);

        tracing::info!(
            stage = self.name(),
            id = created.id,
            db_insert_ms = format!("{:.2}", db_elapsed.as_secs_f64() * 1000.0).as_str(),
            "clip persisted"
        );

        Ok(StageAction::Continue)
    }
}
