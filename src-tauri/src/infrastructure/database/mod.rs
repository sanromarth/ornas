//! Database infrastructure — SQLite connection, migrations, and repository implementations.

pub mod clip_repo;
pub mod collection_repo;
pub mod connection;
pub mod migrations;
pub mod search_repo;
pub mod settings_repo;
pub mod tag_repo;
pub mod vault_repo;

use crate::error::AppError;
use rusqlite::Connection;
use std::sync::{Arc, Mutex, MutexGuard};

/// The central Database struct wrapping a SQLite connection.
#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Creates a new Database instance from an existing connection.
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Arc::new(Mutex::new(conn)),
        }
    }

    /// Acquires the lock and returns a mutable reference to the connection.
    pub fn conn(&self) -> Result<MutexGuard<'_, Connection>, AppError> {
        self.conn
            .lock()
            .map_err(|_| AppError::Internal("Database connection mutex poisoned".into()))
    }
}
