//! Repository traits — abstract contracts for data access.
//!
//! These traits define the interface between the application layer
//! and the infrastructure layer. The domain layer owns the contracts;
//! the infrastructure layer provides the implementations.
//!
//! **No I/O or database types appear here.** Only domain entities and errors.

use crate::domain::clip::{Clip, ClipUpdate, NewClip};
use crate::domain::collection::{Collection, CollectionUpdate, NewCollection};
use crate::domain::tag::{NewTag, Tag, TagUpdate};
use crate::domain::vault::VaultConfig;
use crate::error::AppError;

/// Parameters for paginated list queries.
#[derive(Debug, Clone)]
pub struct ListParams {
    /// Maximum number of results to return.
    pub limit: u32,
    pub cursor_pinned: Option<bool>,
    pub cursor_created_at: Option<i64>,
    pub cursor_id: Option<i64>,
    /// Optional category filter.
    pub category: Option<String>,
    /// If true, show only favorites.
    pub favorites_only: bool,
    /// If true, show only pinned items.
    pub pinned_only: bool,
    /// Optional collection filter.
    pub collection_id: Option<i64>,
    /// Optional tag filter.
    pub tag_id: Option<i64>,
}

impl Default for ListParams {
    fn default() -> Self {
        Self {
            limit: 50,
            cursor_pinned: None,
            cursor_created_at: None,
            cursor_id: None,
            category: None,
            favorites_only: false,
            pinned_only: false,
            collection_id: None,
            tag_id: None,
        }
    }
}

/// Contract for clipboard item persistence.
pub trait ClipRepository: Send + Sync {
    fn create(&self, clip: &NewClip) -> Result<Clip, AppError>;
    fn get_by_id(&self, id: i64) -> Result<Option<Clip>, AppError>;
    fn list(&self, params: &ListParams) -> Result<Vec<Clip>, AppError>;
    fn update(&self, id: i64, update: &ClipUpdate) -> Result<Clip, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
    fn find_by_hash(&self, hash: &str) -> Result<Option<Clip>, AppError>;
    fn set_favorite(&self, id: i64, favorite: bool) -> Result<(), AppError>;
    fn set_pinned(&self, id: i64, pinned: bool) -> Result<(), AppError>;
    fn touch(&self, id: i64) -> Result<(), AppError>;
    /// Prunes clips older than the specified retention period (in seconds)
    /// that are neither pinned nor favorited.
    fn prune_older_than(&self, max_age_secs: i64) -> Result<u64, AppError>;
    /// Retrieves all encrypted clips.
    fn get_encrypted_clips(&self) -> Result<Vec<Clip>, AppError>;
    #[allow(dead_code)]
    fn count(&self) -> Result<u64, AppError>;
}

/// Contract for collections persistence.
pub trait CollectionRepository: Send + Sync {
    fn create(&self, collection: &NewCollection) -> Result<Collection, AppError>;
    fn get_by_id(&self, id: i64) -> Result<Option<Collection>, AppError>;
    fn list(&self) -> Result<Vec<Collection>, AppError>;
    fn update(&self, id: i64, update: &CollectionUpdate) -> Result<Collection, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
    fn assign_clip(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError>;
    fn remove_clip(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError>;
    fn get_collections_for_clip(&self, clip_id: i64) -> Result<Vec<Collection>, AppError>;
}

/// Contract for tags persistence.
pub trait TagRepository: Send + Sync {
    fn create(&self, tag: &NewTag) -> Result<Tag, AppError>;
    fn get_by_id(&self, id: i64) -> Result<Option<Tag>, AppError>;
    fn list(&self) -> Result<Vec<Tag>, AppError>;
    fn update(&self, id: i64, update: &TagUpdate) -> Result<Tag, AppError>;
    fn delete(&self, id: i64) -> Result<(), AppError>;
    fn assign_clip(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError>;
    fn remove_clip(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError>;
    fn get_tags_for_clip(&self, clip_id: i64) -> Result<Vec<Tag>, AppError>;
}

/// Defines the contract for vault configuration data access.
pub trait VaultRepository: Send + Sync {
    /// Loads the vault configuration, if it exists.
    fn load_config(&self) -> Result<Option<VaultConfig>, AppError>;

    /// Saves the vault configuration.
    fn save_config(&self, config: &VaultConfig) -> Result<(), AppError>;
}

/// Contract for full-text search operations.
pub trait SearchRepository: Send + Sync {
    fn search(&self, query: &str, limit: u32, params: &ListParams) -> Result<Vec<Clip>, AppError>;
    #[allow(dead_code)]
    fn optimize_index(&self) -> Result<(), AppError>;
    #[allow(dead_code)]
    fn rebuild_index(&self) -> Result<(), AppError>;
}

/// Contract for application settings persistence.
pub trait SettingsRepository: Send + Sync {
    #[allow(dead_code)]
    fn get(&self, key: &str) -> Result<Option<String>, AppError>;
    fn set(&self, key: &str, value: &str) -> Result<(), AppError>;
    fn get_all(&self) -> Result<Vec<(String, String)>, AppError>;
    #[allow(dead_code)]
    fn delete(&self, key: &str) -> Result<(), AppError>;
}
