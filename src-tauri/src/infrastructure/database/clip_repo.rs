//! SQLite implementation of ClipRepository.
//!
//! All raw SQL for clip CRUD operations lives in this file.
//! Implements the domain::traits::ClipRepository trait.

/// SQLite-backed clip repository.
///
/// Holds a reference to the database connection.
/// Implements ClipRepository trait from the domain layer.
pub struct SqliteClipRepo;

impl SqliteClipRepo {
    /// Creates a new SQLite clip repository.
    pub fn new() -> Self {
        Self
    }
}
