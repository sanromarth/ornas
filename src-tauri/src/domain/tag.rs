//! Tag entity — a label that can be attached to clips.
//!
//! Schema is created in V1.0 but the UI is deferred to V1.1.

use serde::{Deserialize, Serialize};

/// A tag that can be applied to one or more clips.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
}

/// Data required to create a new tag.
#[derive(Debug, Clone)]
pub struct NewTag {
    pub name: String,
    pub color: Option<String>,
}
