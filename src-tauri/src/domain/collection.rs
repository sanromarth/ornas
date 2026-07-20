//! Collection entity — a user-created group of clips.
//!
//! Schema is created in V1.0 but the UI is deferred to V1.1.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

/// A named collection that can contain multiple clips.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub sort_order: i64,
    /// Unix epoch seconds.
    pub created_at: i64,
}

/// Data required to create a new collection.
#[derive(Debug, Clone)]
pub struct NewCollection {
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
}
