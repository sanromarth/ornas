//! SQLite connection management — open, PRAGMA, close.
//!
//! Handles database lifecycle: creation, PRAGMA configuration,
//! and providing a connection handle to repositories.

use crate::error::AppError;
use rusqlite::Connection;
use std::path::Path;

/// Opens a SQLite connection and applies PRAGMA settings.
///
/// If the database file does not exist, it is created and
/// the initial schema is applied via migrations.
pub fn open_database(path: &Path) -> Result<Connection, AppError> {
    let conn = Connection::open(path)?;
    apply_pragmas(&conn)?;
    Ok(conn)
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
