//! Vault repository — SQLite implementation for vault configuration.

use crate::domain::traits::VaultRepository;
use crate::domain::vault::VaultConfig;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::params;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct SqliteVaultRepository {
    db: Arc<Database>,
}

impl SqliteVaultRepository {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

impl VaultRepository for SqliteVaultRepository {
    fn load_config(&self) -> Result<Option<VaultConfig>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare(
            "SELECT id, salt, verification_nonce, verification_payload, created_at, updated_at FROM vault_config WHERE id = 1"
        ).map_err(|e| AppError::Database(e.to_string()))?;

        let mut rows = stmt
            .query([])
            .map_err(|e| AppError::Database(e.to_string()))?;

        if let Some(row) = rows.next().map_err(|e| AppError::Database(e.to_string()))? {
            Ok(Some(VaultConfig {
                id: row.get(0).unwrap_or(1),
                salt: row.get(1).unwrap_or_default(),
                verification_nonce: row.get(2).unwrap_or_default(),
                verification_payload: row.get(3).unwrap_or_default(),
                created_at: row.get(4).unwrap_or(0),
                updated_at: row.get(5).unwrap_or(0),
            }))
        } else {
            Ok(None)
        }
    }

    fn save_config(&self, config: &VaultConfig) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        conn.execute(
            "INSERT INTO vault_config (id, salt, verification_nonce, verification_payload, created_at, updated_at) 
             VALUES (1, ?1, ?2, ?3, ?4, ?4)
             ON CONFLICT(id) DO UPDATE SET 
                salt = excluded.salt, 
                verification_nonce = excluded.verification_nonce,
                verification_payload = excluded.verification_payload,
                updated_at = excluded.updated_at",
            params![
                config.salt,
                config.verification_nonce,
                config.verification_payload,
                now,
            ],
        ).map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }
}
