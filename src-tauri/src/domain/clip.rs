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
    File,
}

impl ContentType {
    /// Returns the string representation used in the database.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::Image => "image",
            Self::RichText => "rich_text",
            Self::File => "file",
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
    pub language: Option<String>,
    pub is_code: bool,
    pub detection_confidence: f64,
    pub language_source: String,

    // Encryption fields
    pub is_encrypted: bool,
    pub encryption_version: Option<i64>,
    pub encrypted_blob: Option<Vec<u8>>,
    pub nonce: Option<Vec<u8>>,

    /// Unix epoch seconds.
    pub created_at: i64,
    /// Unix epoch seconds.
    pub updated_at: i64,
    /// List of files if content_type is File.
    #[serde(default)]
    pub files: Option<Vec<ClipFile>>,
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
    pub language: Option<String>,
    pub is_code: bool,
    pub detection_confidence: f64,
    pub language_source: String,

    // Encryption fields
    pub is_encrypted: bool,
    pub encryption_version: Option<i64>,
    pub encrypted_blob: Option<Vec<u8>>,
    pub nonce: Option<Vec<u8>>,
}

/// Fields that can be updated on an existing clip.
#[derive(Debug, Clone, Default)]
pub struct ClipUpdate {
    pub is_favorite: Option<bool>,
    pub is_pinned: Option<bool>,
    pub language: Option<String>,
    pub language_source: Option<String>,

    // Encryption fields for encrypt/decrypt workflows
    pub content_text: Option<Option<String>>,
    pub content_html: Option<Option<String>>,
    pub content_rtf: Option<Option<String>>,
    pub preview: Option<Option<String>>,
    pub is_encrypted: Option<bool>,
    pub encryption_version: Option<Option<i64>>,
    pub encrypted_blob: Option<Option<Vec<u8>>>,
    pub nonce: Option<Option<Vec<u8>>>,
}

/// A file associated with a clip.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipFile {
    pub id: i64,
    pub clip_id: i64,
    pub file_path: String,
    pub file_name: String,
    pub extension: Option<String>,
    pub mime_type: Option<String>,
    pub file_size: i64,
    pub is_dir: bool,
    pub is_readonly: bool,
    pub created_time: Option<i64>,
    pub modified_time: Option<i64>,
    pub hash: Option<String>,
    pub thumbnail_path: Option<String>,
    pub status: String,
    pub selection_group: i64,
    pub icon_type: String,
    pub created_at: i64,
    pub updated_at: i64,
}
