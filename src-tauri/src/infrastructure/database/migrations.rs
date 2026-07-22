//! Database migrations — versioned schema evolution.
//!
//! Uses `rusqlite_migration` with `PRAGMA user_version` for tracking.
//! Migrations are compiled into the binary via `include_str!()`.

use crate::error::AppError;
use rusqlite::Connection;
use rusqlite_migration::{M, Migrations};

/// All database migrations in order. Each migration runs atomically.
pub fn get_migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(include_str!("../../../migrations/001_initial.sql")),
        M::up(include_str!("../../../migrations/002_files.sql")),
        M::up(include_str!("../../../migrations/003_allow_file_type.sql")),
        M::up(include_str!(
            "../../../migrations/004_collections_indexes.sql"
        )),
        M::up(include_str!("../../../migrations/005_code_snippets.sql")),
        M::up(include_str!(
            "../../../migrations/006_encrypted_storage.sql"
        )),
        M::up(include_str!(
            "../../../migrations/007_performance_indexes.sql"
        )),
    ])
}

/// Runs all pending database migrations on the connection.
pub fn run_migrations(conn: &mut Connection) -> Result<(), AppError> {
    get_migrations()
        .to_latest(conn)
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(())
}
