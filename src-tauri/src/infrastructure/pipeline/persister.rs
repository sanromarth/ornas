//! Stage 6: Persister — write clip to SQLite and save images to filesystem.
//!
//! Converts a pipeline `ClipItem` into a `NewClip` and persists it
//! via the clip repository. Images are saved to the filesystem first.

use crate::domain::clip::{ContentType, NewClip};
use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::domain::traits::ClipRepository;
use crate::error::AppError;
use crate::infrastructure::image_store::ImageStore;
use std::sync::Arc;

/// Stage 6: Persists the processed clip to the database.
///
/// For image content, saves the image file first via `ImageStore`,
/// then inserts the clip row with the image path.
pub struct Persister {
    clip_repo: Arc<dyn ClipRepository>,
    image_store: Arc<ImageStore>,
}

impl Persister {
    /// Creates a new Persister with the given repository and image store.
    pub fn new(clip_repo: Arc<dyn ClipRepository>, image_store: Arc<ImageStore>) -> Self {
        Self {
            clip_repo,
            image_store,
        }
    }
}

impl PipelineStage for Persister {
    fn name(&self) -> &'static str {
        "persister"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        // Save image to filesystem if present
        if let Some(ref bytes) = item.image_bytes {
            let path = self.image_store.save(&item.content_hash, bytes)?;
            item.image_path = Some(path);
        }

        let content_type = match item.content_type.as_str() {
            "image" => ContentType::Image,
            "rich_text" => ContentType::RichText,
            _ => ContentType::Text,
        };

        let new_clip = NewClip {
            content_text: item.content_text.clone(),
            content_html: item.content_html.clone(),
            content_rtf: item.content_rtf.clone(),
            image_path: item.image_path.clone(),
            content_type,
            category: item.category.clone(),
            source_app: item.source_app.clone(),
            content_hash: item.content_hash.clone(),
            preview: item.preview.clone(),
            char_count: item.char_count,
            line_count: item.line_count,
            language: item.language.clone(),
            is_code: item.is_code,
            detection_confidence: item.detection_confidence,
            language_source: item.language_source.clone(),
        };

        let created = self.clip_repo.create(&new_clip)?;
        item.assigned_id = Some(created.id);

        tracing::info!(
            stage = self.name(),
            id = created.id,
            category = %item.category,
            "clip persisted"
        );

        Ok(StageAction::Continue)
    }
}
