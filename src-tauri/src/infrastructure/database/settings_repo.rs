//! SQLite implementation of SettingsRepository.
//!
//! Simple key-value store backed by the settings table.

/// SQLite-backed settings repository.
pub struct SqliteSettingsRepo;

impl SqliteSettingsRepo {
    pub fn new() -> Self {
        Self
    }
}
