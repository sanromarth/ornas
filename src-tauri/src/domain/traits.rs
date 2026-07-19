//! Repository traits — abstract contracts for data access.
//!
//! These traits define the interface between the application layer
//! and the infrastructure layer. The domain layer owns the contracts;
//! the infrastructure layer provides the implementations.
//!
//! **No I/O or database types appear here.** Only domain entities and errors.

use crate::domain::clip::{Clip, ClipUpdate, NewClip};
use crate::error::AppError;

/// Parameters for paginated list queries.
#[derive(Debug, Clone)]
pub struct ListParams {
    /// Maximum number of results to return.
    pub limit: u32,
    /// Number of results to skip.
    pub offset: u32,
    /// Optional category filter.
    pub category: Option<String>,
    /// If true, show only favorites.
    pub favorites_only: bool,
    /// If true, show only pinned items.
    pub pinned_only: bool,
}

impl Default for ListParams {
    fn default() -> Self {
        Self {
            limit: 50,
            offset: 0,
            category: None,
            favorites_only: false,
            pinned_only: false,
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
    fn prune_older_than(&self, max_age_secs: i64) -> Result<u64, AppError>;
    fn count(&self) -> Result<u64, AppError>;
}

/// Contract for full-text search operations.
pub trait SearchRepository: Send + Sync {
    fn search(&self, query: &str, limit: u32) -> Result<Vec<Clip>, AppError>;
    fn optimize_index(&self) -> Result<(), AppError>;
    fn rebuild_index(&self) -> Result<(), AppError>;
}

/// Contract for application settings persistence.
pub trait SettingsRepository: Send + Sync {
    fn get(&self, key: &str) -> Result<Option<String>, AppError>;
    fn set(&self, key: &str, value: &str) -> Result<(), AppError>;
    fn get_all(&self) -> Result<Vec<(String, String)>, AppError>;
    fn delete(&self, key: &str) -> Result<(), AppError>;
}
