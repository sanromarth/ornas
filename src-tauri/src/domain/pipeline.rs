//! Pipeline stage trait — the contract for clipboard processing stages.
//!
//! Each stage in the clipboard pipeline implements this trait.
//! Stages are composed into a sequential pipeline by the runner.
//! See ARCHITECTURE_FINAL.md §7 for the full pipeline specification.

use crate::error::AppError;

/// The item flowing through the clipboard processing pipeline.
///
/// Each stage may read and mutate this struct as it passes through.
#[derive(Debug, Clone)]
pub struct ClipItem {
    /// Database ID assigned after persistence (set by Persister stage).
    pub assigned_id: Option<i64>,
    /// Raw text content from the clipboard.
    pub content_text: Option<String>,
    /// HTML content (from rich copy).
    pub content_html: Option<String>,
    /// RTF content (from rich copy).
    pub content_rtf: Option<String>,
    /// Raw image bytes (before filesystem storage).
    pub image_bytes: Option<Vec<u8>>,
    /// Filesystem path after image is saved (set by Persister stage).
    pub image_path: Option<String>,
    /// Content type classification.
    pub content_type: String,
    /// Detected content category (set by Categorizer stage).
    pub category: String,
    /// Source application name.
    pub source_app: Option<String>,
    /// Content hash for deduplication (set by Hasher stage).
    pub content_hash: String,
    /// Preview text for UI display (set by Metadata stage).
    pub preview: Option<String>,
    /// Character count (set by Metadata stage).
    pub char_count: i64,
    /// Line count (set by Metadata stage).
    pub line_count: i64,
    /// Detected language (set by CodeDetector stage).
    pub language: Option<String>,
    /// Whether this is code (set by CodeDetector stage).
    pub is_code: bool,
    /// Detection confidence (set by CodeDetector stage).
    pub detection_confidence: f64,
    /// Language source, auto or manual (set by CodeDetector stage).
    pub language_source: String,
}

impl ClipItem {
    /// Creates a new pipeline item from raw text content.
    pub fn from_text(text: String) -> Self {
        Self {
            assigned_id: None,
            content_text: Some(text),
            content_html: None,
            content_rtf: None,
            image_bytes: None,
            image_path: None,
            content_type: "text".into(),
            category: "plain_text".into(),
            source_app: None,
            content_hash: String::new(),
            preview: None,
            char_count: 0,
            line_count: 0,
            language: None,
            is_code: false,
            detection_confidence: 0.0,
            language_source: "auto".to_string(),
        }
    }

    /// Creates a new pipeline item from image bytes.
    pub fn from_image(bytes: Vec<u8>) -> Self {
        Self {
            assigned_id: None,
            content_text: None,
            content_html: None,
            content_rtf: None,
            image_bytes: Some(bytes),
            image_path: None,
            content_type: "image".into(),
            category: "plain_text".into(),
            source_app: None,
            content_hash: String::new(),
            preview: None,
            char_count: 0,
            line_count: 0,
            language: None,
            is_code: false,
            detection_confidence: 0.0,
            language_source: "auto".to_string(),
        }
    }
}

/// Action returned by a pipeline stage after processing.
#[derive(Debug)]
pub enum StageAction {
    /// Continue to the next stage.
    Continue,
    /// Skip remaining stages (e.g., duplicate detected).
    Skip { reason: &'static str },
}

/// The contract for a clipboard processing pipeline stage.
///
/// Each implementation handles exactly one responsibility.
/// Stages are composed into a sequential pipeline by the runner.
pub trait PipelineStage: Send + Sync {
    /// Human-readable name for logging and debugging.
    fn name(&self) -> &'static str;

    /// Process the item. May mutate the item in place.
    /// Returns the action to take after this stage.
    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError>;
}
