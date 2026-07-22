//! SQLite implementation of TagRepository.

use crate::domain::tag::{NewTag, Tag, TagUpdate};
use crate::domain::traits::TagRepository;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::{OptionalExtension, Row, params};
use std::sync::Arc;

/// SQLite-backed tag repository.
pub struct SqliteTagRepo {
    db: Arc<Database>,
}

impl SqliteTagRepo {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

fn row_to_tag(row: &Row) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
    })
}

impl TagRepository for SqliteTagRepo {
    fn create(&self, tag: &NewTag) -> Result<Tag, AppError> {
        let conn = self.db.conn()?;

        let mut stmt = conn.prepare(
            "INSERT INTO tags (name, color) 
             VALUES (?1, ?2) RETURNING *",
        )?;

        let created = stmt.query_row(params![tag.name, tag.color], row_to_tag)?;

        Ok(created)
    }

    fn get_by_id(&self, id: i64) -> Result<Option<Tag>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT * FROM tags WHERE id = ?1")?;
        let tag = stmt.query_row(params![id], row_to_tag).optional()?;
        Ok(tag)
    }

    fn list(&self) -> Result<Vec<Tag>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name ASC")?;
        let iter = stmt.query_map([], row_to_tag)?;
        let mut tags = Vec::new();
        for res in iter {
            tags.push(res?);
        }
        Ok(tags)
    }

    fn update(&self, id: i64, update: &TagUpdate) -> Result<Tag, AppError> {
        let conn = self.db.conn()?;

        let mut sql = String::from("UPDATE tags SET ");
        let mut sql_params: Vec<rusqlite::types::Value> = Vec::new();
        let mut updates = Vec::new();

        if let Some(name) = &update.name {
            updates.push(format!("name = ?{}", sql_params.len() + 1));
            sql_params.push(name.clone().into());
        }
        if let Some(color) = &update.color {
            updates.push(format!("color = ?{}", sql_params.len() + 1));
            sql_params.push(color.clone().into());
        }

        if updates.is_empty() {
            let tag = self
                .get_by_id(id)?
                .ok_or_else(|| AppError::NotFound(format!("Tag {id} not found")))?;
            return Ok(tag);
        }

        sql.push_str(&updates.join(", "));
        sql.push_str(&format!(
            " WHERE id = ?{} RETURNING *",
            sql_params.len() + 1
        ));
        sql_params.push(id.into());

        let mut stmt = conn.prepare(&sql)?;
        let tag = stmt.query_row(rusqlite::params_from_iter(sql_params), row_to_tag)?;

        Ok(tag)
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn assign_clip(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute(
            "INSERT OR IGNORE INTO clip_tags (clip_id, tag_id) VALUES (?1, ?2)",
            params![clip_id, tag_id],
        )?;
        Ok(())
    }

    fn remove_clip(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute(
            "DELETE FROM clip_tags WHERE clip_id = ?1 AND tag_id = ?2",
            params![clip_id, tag_id],
        )?;
        Ok(())
    }

    fn get_tags_for_clip(&self, clip_id: i64) -> Result<Vec<Tag>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare(
            "SELECT t.* FROM tags t 
             JOIN clip_tags ct ON t.id = ct.tag_id 
             WHERE ct.clip_id = ?1 
             ORDER BY t.name ASC",
        )?;
        let iter = stmt.query_map(params![clip_id], row_to_tag)?;
        let mut tags = Vec::new();
        for res in iter {
            tags.push(res?);
        }
        Ok(tags)
    }
}
