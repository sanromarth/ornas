//! Clip entity — the core data type representing a clipboard entry.
//!
//! Every item captured from the clipboard becomes a `Clip`.
//! This module defines the entity struct and its creation/update types.

use serde::{Deserialize, Serialize};

/// The type of content stored in a clip.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ContentType {
    Text,
    Image,
    RichText,
}

impl ContentType {
    /// Returns the string representation used in the database.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::Image => "image",
            Self::RichText => "rich_text",
        }
    }
}

/// A clipboard entry stored in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
    pub id: i64,
    pub content_text: Option<String>,
    pub content_html: Option<String>,
    pub content_rtf: Option<String>,
    pub image_path: Option<String>,
    pub content_type: ContentType,
    pub category: String,
    pub source_app: Option<String>,
    pub content_hash: String,
    pub preview: Option<String>,
    pub char_count: i64,
    pub line_count: i64,
    pub is_favorite: bool,
    pub is_pinned: bool,
    /// Unix epoch seconds.
    pub created_at: i64,
    /// Unix epoch seconds.
    pub updated_at: i64,
}

/// Data required to create a new clip (before persistence assigns an ID).
#[derive(Debug, Clone)]
pub struct NewClip {
    pub content_text: Option<String>,
    pub content_html: Option<String>,
    pub content_rtf: Option<String>,
    pub image_path: Option<String>,
    pub content_type: ContentType,
    pub category: String,
    pub source_app: Option<String>,
    pub content_hash: String,
    pub preview: Option<String>,
    pub char_count: i64,
    pub line_count: i64,
}

/// Fields that can be updated on an existing clip.
#[derive(Debug, Clone, Default)]
pub struct ClipUpdate {
    pub is_favorite: Option<bool>,
    pub is_pinned: Option<bool>,
}
