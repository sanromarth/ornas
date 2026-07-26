//! SQLite connection management — open, PRAGMA, close.
//!
//! Handles database lifecycle: creation, PRAGMA configuration,
//! and providing a connection handle to repositories.

use crate::error::AppError;
use rusqlite::Connection;
use std::path::{Path, PathBuf};

/// Resolves to {app_data_dir}/ornas.db, creates parent dirs if needed
pub fn database_path(app_data_dir: &Path) -> Result<PathBuf, AppError> {
    std::fs::create_dir_all(app_data_dir)?;
    Ok(app_data_dir.join("ornas.db"))
}

/// Opens a SQLite connection and applies PRAGMA settings.
///
/// If the database file does not exist, it is created and
/// the initial schema is applied via migrations.
pub fn open_database(path: &Path) -> Result<Connection, AppError> {
    let new_file = !path.exists();
    let conn = Connection::open(path)?;
    if new_file {
        init_new_database(&conn)?;
    }
    apply_pragmas(&conn)?;
    Ok(conn)
}

/// Applies one-time initialization for a new database.
fn init_new_database(conn: &Connection) -> Result<(), AppError> {
    // auto_vacuum MUST be set before any tables exist
    conn.execute_batch("PRAGMA auto_vacuum = NONE;")?;
    Ok(())
}

/// Applies performance and safety PRAGMAs on every connection open.
///
/// See ARCHITECTURE_FINAL.md §9 for the full PRAGMA specification.
fn apply_pragmas(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA busy_timeout = 5000;
         PRAGMA foreign_keys = ON;
         PRAGMA cache_size = -16000;
         PRAGMA mmap_size = 268435456;
         PRAGMA temp_store = MEMORY;",
    )?;
    Ok(())
}

/// Opens an in-memory SQLite connection for testing.
#[cfg(test)]
pub fn open_in_memory() -> Result<Connection, AppError> {
    let conn = Connection::open_in_memory()?;
    apply_pragmas(&conn)?;
    Ok(conn)
}
