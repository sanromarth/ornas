//! SQLite implementation of SearchRepository.
//!
//! Handles FTS5 full-text search queries and index maintenance.

/// SQLite-backed search repository using FTS5.
pub struct SqliteSearchRepo;

impl SqliteSearchRepo {
    pub fn new() -> Self {
        Self
    }
}
