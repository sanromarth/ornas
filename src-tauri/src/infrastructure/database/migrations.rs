//! Database migrations — versioned schema evolution.
//!
//! Uses `rusqlite_migration` with `PRAGMA user_version` for tracking.
//! Migrations are compiled into the binary via `include_str!()`.

use rusqlite_migration::{Migrations, M};

/// All database migrations in order. Each migration runs atomically.
pub fn get_migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(include_str!("../../../migrations/001_initial.sql")),
    ])
}
