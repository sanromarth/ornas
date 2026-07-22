//! Search service — coordinates FTS5 queries with fuzzy re-ranking.
//!
//! Delegates search to the SearchRepository and provides
//! index maintenance operations.

use crate::domain::clip::Clip;
use crate::domain::traits::SearchRepository;
use crate::error::AppError;
use std::sync::Arc;

/// Search service that coordinates full-text search operations.
pub struct SearchService {
    search_repo: Arc<dyn SearchRepository>,
}

impl SearchService {
    /// Creates a new search service.
    pub fn new(search_repo: Arc<dyn SearchRepository>) -> Self {
        Self { search_repo }
    }

    /// Performs a full-text search with the given query.
    pub fn search(&self, query: &str, limit: u32, params: &crate::domain::traits::ListParams) -> Result<Vec<Clip>, AppError> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }
        self.search_repo.search(query, limit, params)
    }

    /// Optimizes the FTS5 index (called during idle or shutdown).
    #[allow(dead_code)]
    pub fn optimize_index(&self) -> Result<(), AppError> {
        self.search_repo.optimize_index()
    }

    /// Rebuilds the FTS5 index from scratch.
    #[allow(dead_code)]
    pub fn rebuild_index(&self) -> Result<(), AppError> {
        self.search_repo.rebuild_index()
    }
}
