//! SQLite implementation of SettingsRepository.
//!
//! Simple key-value store backed by the settings table.

use crate::domain::traits::SettingsRepository;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::{OptionalExtension, params};
use std::sync::Arc;

/// SQLite-backed settings repository.
pub struct SqliteSettingsRepo {
    db: Arc<Database>,
}

impl SqliteSettingsRepo {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

impl SettingsRepository for SqliteSettingsRepo {
    fn get(&self, key: &str) -> Result<Option<String>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let value: Option<String> = stmt.query_row(params![key], |row| row.get(0)).optional()?;
        Ok(value)
    }

    fn set(&self, key: &str, value: &str) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare(
            "INSERT INTO settings (key, value, updated_at) 
             VALUES (?1, ?2, unixepoch()) 
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()",
        )?;
        stmt.execute(params![key, value])?;
        Ok(())
    }

    fn get_all(&self) -> Result<Vec<(String, String)>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let iter = stmt.query_map([], |row| {
            let k: String = row.get(0)?;
            let v: String = row.get(1)?;
            Ok((k, v))
        })?;

        let mut settings = Vec::new();
        for item in iter {
            settings.push(item?);
        }
        Ok(settings)
    }

    fn delete(&self, key: &str) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("DELETE FROM settings WHERE key = ?1")?;
        stmt.execute(params![key])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::database::connection::open_in_memory;
    use crate::infrastructure::database::migrations::run_migrations;

    fn setup_test_db() -> Arc<Database> {
        let mut conn = open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        Arc::new(Database::new(conn))
    }

    #[test]
    fn test_settings_crud() {
        let db = setup_test_db();
        let repo = SqliteSettingsRepo::new(db);

        // Set
        repo.set("theme", "dark").unwrap();
        repo.set("theme", "light").unwrap(); // upsert

        // Get
        let theme = repo.get("theme").unwrap();
        assert_eq!(theme.unwrap(), "light");

        // Get all
        let all = repo.get_all().unwrap();
        assert_eq!(all.len(), 1);

        // Delete
        repo.delete("theme").unwrap();
        let theme = repo.get("theme").unwrap();
        assert!(theme.is_none());
    }
}
