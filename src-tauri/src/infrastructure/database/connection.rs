//! SQLite connection management — open, PRAGMA, close.
//!
//! Handles database lifecycle: creation, PRAGMA configuration,
//! and providing a connection handle to repositories.

use crate::error::AppError;
use rusqlite::Connection;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// Resolves to {app_data_dir}/ornas.db, creates parent dirs if needed
pub fn database_path(app_data_dir: &Path) -> Result<PathBuf, AppError> {
    std::fs::create_dir_all(app_data_dir)?;
    Ok(app_data_dir.join("ornas.db"))
}

/// Opens a SQLite connection and applies PRAGMA settings.
///
/// If the database file does not exist, it is created and
/// the initial schema is applied via migrations.
///
/// Returns (Connection, bool) where bool is `was_corrupted`.
pub fn open_database(path: &Path) -> Result<(Connection, bool), AppError> {
    let mut was_corrupted = false;

    // Check integrity if file exists
    if path.exists() {
        if let Err(e) = verify_database_integrity(path) {
            eprintln!("[ORNAS] Database corruption detected: {}", e);
            recover_corrupted_database(path)?;
            was_corrupted = true;
        }
    }

    let new_file = !path.exists();
    let conn = Connection::open(path)?;

    if new_file {
        init_new_database(&conn)?;
    }
    apply_pragmas(&conn)?;

    Ok((conn, was_corrupted))
}

/// Performs PRAGMA quick_check and foreign_key_check
fn verify_database_integrity(path: &Path) -> Result<(), String> {
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

    // Quick check
    let quick_check: String = conn
        .query_row("PRAGMA quick_check;", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if quick_check.to_lowercase() != "ok" {
        return Err(format!("quick_check failed: {}", quick_check));
    }

    // Foreign key check - returns rows if there are violations
    let mut stmt = conn
        .prepare("PRAGMA foreign_key_check;")
        .map_err(|e| e.to_string())?;
    let violations = stmt
        .query_map([], |row| {
            // Return dummy value, we just care if rows exist
            Ok(row.get::<_, i64>(0).unwrap_or(0))
        })
        .map_err(|e| e.to_string())?;

    if violations.count() > 0 {
        return Err("foreign_key_check failed: violations found".into());
    }

    Ok(())
}

/// Safely moves the corrupted database aside
fn recover_corrupted_database(path: &Path) -> Result<(), AppError> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let base_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("ornas");
    let corrupt_name = format!("{}.corrupt.{}.db", base_name, timestamp);
    let corrupt_path = path.with_file_name(corrupt_name);

    std::fs::rename(path, &corrupt_path)
        .map_err(|e| AppError::Internal(format!("Failed to move corrupt database: {}", e)))?;

    // Also move WAL and SHM if they exist
    let wal_path = path.with_extension("db-wal");
    if wal_path.exists() {
        let _ = std::fs::rename(&wal_path, corrupt_path.with_extension("db-wal"));
    }
    let shm_path = path.with_extension("db-shm");
    if shm_path.exists() {
        let _ = std::fs::rename(&shm_path, corrupt_path.with_extension("db-shm"));
    }

    Ok(())
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
