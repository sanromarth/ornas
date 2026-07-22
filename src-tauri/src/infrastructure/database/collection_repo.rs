//! SQLite implementation of CollectionRepository.

use crate::domain::collection::{Collection, CollectionUpdate, NewCollection};
use crate::domain::traits::CollectionRepository;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::{OptionalExtension, Row, params};
use std::sync::Arc;

/// SQLite-backed collection repository.
pub struct SqliteCollectionRepo {
    db: Arc<Database>,
}

impl SqliteCollectionRepo {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

fn row_to_collection(row: &Row) -> rusqlite::Result<Collection> {
    Ok(Collection {
        id: row.get(0)?,
        name: row.get(1)?,
        icon: row.get(2)?,
        color: row.get(3)?,
        sort_order: row.get(4)?,
        created_at: row.get(5)?,
    })
}

impl CollectionRepository for SqliteCollectionRepo {
    fn create(&self, collection: &NewCollection) -> Result<Collection, AppError> {
        let conn = self.db.conn()?;

        // Find max sort_order
        let sort_order: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM collections",
            [],
            |row| row.get(0),
        )?;

        let mut stmt = conn.prepare(
            "INSERT INTO collections (name, icon, color, sort_order) 
             VALUES (?1, ?2, ?3, ?4) RETURNING *",
        )?;

        let created = stmt.query_row(
            params![
                collection.name,
                collection.icon,
                collection.color,
                sort_order
            ],
            row_to_collection,
        )?;

        Ok(created)
    }

    fn get_by_id(&self, id: i64) -> Result<Option<Collection>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT * FROM collections WHERE id = ?1")?;
        let col = stmt.query_row(params![id], row_to_collection).optional()?;
        Ok(col)
    }

    fn list(&self) -> Result<Vec<Collection>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt =
            conn.prepare("SELECT * FROM collections ORDER BY sort_order ASC, created_at DESC")?;
        let iter = stmt.query_map([], row_to_collection)?;
        let mut cols = Vec::new();
        for res in iter {
            cols.push(res?);
        }
        Ok(cols)
    }

    fn update(&self, id: i64, update: &CollectionUpdate) -> Result<Collection, AppError> {
        let conn = self.db.conn()?;

        let mut sql = String::from("UPDATE collections SET ");
        let mut sql_params: Vec<rusqlite::types::Value> = Vec::new();
        let mut updates = Vec::new();

        if let Some(name) = &update.name {
            updates.push(format!("name = ?{}", sql_params.len() + 1));
            sql_params.push(name.clone().into());
        }
        if let Some(icon) = &update.icon {
            updates.push(format!("icon = ?{}", sql_params.len() + 1));
            sql_params.push(icon.clone().into());
        }
        if let Some(color) = &update.color {
            updates.push(format!("color = ?{}", sql_params.len() + 1));
            sql_params.push(color.clone().into());
        }
        if let Some(sort_order) = update.sort_order {
            updates.push(format!("sort_order = ?{}", sql_params.len() + 1));
            sql_params.push(sort_order.into());
        }

        if updates.is_empty() {
            let col = self
                .get_by_id(id)?
                .ok_or_else(|| AppError::NotFound(format!("Collection {id} not found")))?;
            return Ok(col);
        }

        sql.push_str(&updates.join(", "));
        sql.push_str(&format!(
            " WHERE id = ?{} RETURNING *",
            sql_params.len() + 1
        ));
        sql_params.push(id.into());

        let mut stmt = conn.prepare(&sql)?;
        let col = stmt.query_row(rusqlite::params_from_iter(sql_params), row_to_collection)?;

        Ok(col)
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute("DELETE FROM collections WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn assign_clip(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute(
            "INSERT OR IGNORE INTO clip_collections (clip_id, collection_id) VALUES (?1, ?2)",
            params![clip_id, collection_id],
        )?;
        Ok(())
    }

    fn remove_clip(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute(
            "DELETE FROM clip_collections WHERE clip_id = ?1 AND collection_id = ?2",
            params![clip_id, collection_id],
        )?;
        Ok(())
    }

    fn get_collections_for_clip(&self, clip_id: i64) -> Result<Vec<Collection>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare(
            "SELECT c.* FROM collections c 
             JOIN clip_collections cc ON c.id = cc.collection_id 
             WHERE cc.clip_id = ?1 
             ORDER BY c.sort_order ASC, c.created_at DESC",
        )?;
        let iter = stmt.query_map(params![clip_id], row_to_collection)?;
        let mut cols = Vec::new();
        for res in iter {
            cols.push(res?);
        }
        Ok(cols)
    }
}
