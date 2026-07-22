//! SQLite implementation of ClipRepository.
//!
//! All raw SQL for clip CRUD operations lives in this file.
//! Implements the domain::traits::ClipRepository trait.

use crate::domain::clip::{Clip, ClipUpdate, ContentType, NewClip};
use crate::domain::traits::{ClipRepository, ListParams};
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::{OptionalExtension, Row, params};
use std::sync::Arc;

/// SQLite-backed clip repository.
///
/// Holds a reference to the database connection.
/// Implements ClipRepository trait from the domain layer.
pub struct SqliteClipRepo {
    db: Arc<Database>,
}

impl SqliteClipRepo {
    /// Creates a new SQLite clip repository.
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

pub(crate) fn row_to_clip(row: &Row) -> Result<Clip, rusqlite::Error> {
    let content_type_str: String = row.get("content_type")?;
    let content_type = match content_type_str.as_str() {
        "text" => ContentType::Text,
        "image" => ContentType::Image,
        "rich_text" => ContentType::RichText,
        _ => ContentType::Text,
    };

    Ok(Clip {
        id: row.get("id")?,
        content_text: row.get("content_text")?,
        content_html: row.get("content_html")?,
        content_rtf: row.get("content_rtf")?,
        image_path: row.get("image_path")?,
        content_type,
        category: row.get("category")?,
        source_app: row.get("source_app")?,
        content_hash: row.get("content_hash")?,
        preview: row.get("preview")?,
        char_count: row.get("char_count")?,
        line_count: row.get("line_count")?,
        language: row.get("language").unwrap_or(None),
        is_code: row.get::<_, i64>("is_code").unwrap_or(0) != 0,
        detection_confidence: row.get("detection_confidence").unwrap_or(0.0),
        language_source: row
            .get("language_source")
            .unwrap_or_else(|_| "auto".to_string()),
        is_favorite: row.get::<_, i64>("is_favorite")? != 0,
        is_pinned: row.get::<_, i64>("is_pinned")? != 0,
        is_encrypted: row.get::<_, i64>("is_encrypted").unwrap_or(0) != 0,
        encryption_version: row.get("encryption_version").unwrap_or(None),
        encrypted_blob: row.get("encrypted_blob").unwrap_or(None),
        nonce: row.get("nonce").unwrap_or(None),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        files: None,
    })
}

fn fetch_clip_files(
    conn: &rusqlite::Connection,
    clip_ids: &[i64],
) -> Result<std::collections::HashMap<i64, Vec<crate::domain::clip::ClipFile>>, AppError> {
    if clip_ids.is_empty() {
        return Ok(std::collections::HashMap::new());
    }

    let placeholders = clip_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let query = format!(
        "SELECT id, clip_id, file_path, file_name, extension, mime_type, file_size, is_dir, is_readonly, created_time, modified_time, hash, thumbnail_path, status, selection_group, icon_type, created_at, updated_at FROM clip_files WHERE clip_id IN ({})",
        placeholders
    );

    let mut stmt = conn.prepare(&query)?;
    let mut rows = stmt.query(rusqlite::params_from_iter(clip_ids))?;

    let mut map: std::collections::HashMap<i64, Vec<crate::domain::clip::ClipFile>> =
        std::collections::HashMap::new();

    while let Some(row) = rows.next()? {
        let clip_id: i64 = row.get(1)?;
        let file = crate::domain::clip::ClipFile {
            id: row.get(0)?,
            clip_id,
            file_path: row.get(2)?,
            file_name: row.get(3)?,
            extension: row.get(4)?,
            mime_type: row.get(5)?,
            file_size: row.get(6)?,
            is_dir: row.get::<_, i64>(7)? != 0,
            is_readonly: row.get::<_, i64>(8)? != 0,
            created_time: row.get(9)?,
            modified_time: row.get(10)?,
            hash: row.get(11)?,
            thumbnail_path: row.get(12)?,
            status: row.get(13)?,
            selection_group: row.get(14)?,
            icon_type: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
        };
        map.entry(clip_id).or_default().push(file);
    }

    Ok(map)
}

impl ClipRepository for SqliteClipRepo {
    fn create(&self, clip: &NewClip) -> Result<Clip, AppError> {
        let conn = self.db.conn()?;

        let mut stmt = conn.prepare(
            "INSERT INTO clips (
                content_text, content_html, content_rtf, image_path,
                content_type, category, source_app, content_hash,
                preview, char_count, line_count, language, is_code, detection_confidence, language_source,
                is_encrypted, encryption_version, encrypted_blob, nonce
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19
            ) RETURNING *",
        )?;

        let created_clip = stmt.query_row(
            params![
                clip.content_text,
                clip.content_html,
                clip.content_rtf,
                clip.image_path,
                clip.content_type.as_str(),
                clip.category,
                clip.source_app,
                clip.content_hash,
                clip.preview,
                clip.char_count,
                clip.line_count,
                clip.language,
                if clip.is_code { 1_i64 } else { 0_i64 },
                clip.detection_confidence,
                clip.language_source,
                if clip.is_encrypted { 1_i64 } else { 0_i64 },
                clip.encryption_version,
                clip.encrypted_blob,
                clip.nonce,
            ],
            row_to_clip,
        )?;

        Ok(created_clip)
    }

    fn get_by_id(&self, id: i64) -> Result<Option<Clip>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT * FROM clips WHERE id = ?1")?;
        let clip = stmt.query_row(params![id], row_to_clip).optional()?;
        if let Some(mut c) = clip {
            if c.content_type == ContentType::File {
                let map = fetch_clip_files(&conn, &[c.id])?;
                c.files = map.get(&c.id).cloned();
            }
            Ok(Some(c))
        } else {
            Ok(None)
        }
    }

    fn list(&self, params: &ListParams) -> Result<Vec<Clip>, AppError> {
        let conn = self.db.conn()?;

        let mut query = String::from("SELECT c.* FROM clips c");
        let mut sql_params: Vec<rusqlite::types::Value> = Vec::new();

        if params.collection_id.is_some() {
            query.push_str(" JOIN clip_collections cc ON c.id = cc.clip_id");
        }
        if params.tag_id.is_some() {
            query.push_str(" JOIN clip_tags ct ON c.id = ct.clip_id");
        }

        query.push_str(" WHERE 1=1");

        if let Some(category) = &params.category {
            query.push_str(" AND c.category = ?");
            sql_params.push(category.clone().into());
        }

        if params.favorites_only {
            query.push_str(" AND c.is_favorite = 1");
        }

        if params.pinned_only {
            query.push_str(" AND c.is_pinned = 1");
        }

        if let Some(col_id) = params.collection_id {
            query.push_str(" AND cc.collection_id = ?");
            sql_params.push(col_id.into());
        }

        if let Some(tag_id) = params.tag_id {
            query.push_str(" AND ct.tag_id = ?");
            sql_params.push(tag_id.into());
        }

        if let (Some(cursor_pinned), Some(cursor_created_at), Some(cursor_id)) = (
            params.cursor_pinned,
            params.cursor_created_at,
            params.cursor_id,
        ) {
            let p = if cursor_pinned { 1_i64 } else { 0_i64 };
            query.push_str(" AND (c.is_pinned, c.created_at, c.id) < (?, ?, ?)");
            sql_params.push(p.into());
            sql_params.push(cursor_created_at.into());
            sql_params.push(cursor_id.into());
        }

        query.push_str(" ORDER BY c.is_pinned DESC, c.created_at DESC, c.id DESC LIMIT ?");
        sql_params.push(params.limit.into());

        let mut stmt = conn.prepare(&query)?;
        let clip_iter = stmt.query_map(rusqlite::params_from_iter(sql_params), row_to_clip)?;

        let mut clips = Vec::new();
        let mut file_clip_ids = Vec::new();
        for clip_result in clip_iter {
            let clip = clip_result?;
            if clip.content_type == ContentType::File {
                file_clip_ids.push(clip.id);
            }
            clips.push(clip);
        }

        if !file_clip_ids.is_empty() {
            if let Ok(files_map) = fetch_clip_files(&conn, &file_clip_ids) {
                for clip in &mut clips {
                    if clip.content_type == ContentType::File {
                        clip.files = files_map.get(&clip.id).cloned();
                    }
                }
            }
        }

        Ok(clips)
    }

    fn update(&self, id: i64, update: &ClipUpdate) -> Result<Clip, AppError> {
        let conn = self.db.conn()?;

        let mut query = String::from("UPDATE clips SET updated_at = unixepoch()");
        let mut sql_params: Vec<rusqlite::types::Value> = Vec::new();

        if let Some(fav) = update.is_favorite {
            query.push_str(&format!(", is_favorite = ?{}", sql_params.len() + 1));
            sql_params.push(if fav { 1_i64 } else { 0_i64 }.into());
        }

        if let Some(pin) = update.is_pinned {
            query.push_str(&format!(", is_pinned = ?{}", sql_params.len() + 1));
            sql_params.push(if pin { 1_i64 } else { 0_i64 }.into());
        }

        if let Some(lang) = &update.language {
            query.push_str(&format!(", language = ?{}", sql_params.len() + 1));
            sql_params.push(lang.clone().into());
        }

        if let Some(lang_src) = &update.language_source {
            query.push_str(&format!(", language_source = ?{}", sql_params.len() + 1));
            sql_params.push(lang_src.clone().into());
        }

        if let Some(ref val) = update.content_text {
            query.push_str(&format!(", content_text = ?{}", sql_params.len() + 1));
            sql_params.push(val.clone().into());
        }

        if let Some(ref val) = update.content_html {
            query.push_str(&format!(", content_html = ?{}", sql_params.len() + 1));
            sql_params.push(val.clone().into());
        }

        if let Some(ref val) = update.content_rtf {
            query.push_str(&format!(", content_rtf = ?{}", sql_params.len() + 1));
            sql_params.push(val.clone().into());
        }

        if let Some(ref val) = update.preview {
            query.push_str(&format!(", preview = ?{}", sql_params.len() + 1));
            sql_params.push(val.clone().into());
        }

        if let Some(enc) = update.is_encrypted {
            query.push_str(&format!(", is_encrypted = ?{}", sql_params.len() + 1));
            sql_params.push(if enc { 1_i64 } else { 0_i64 }.into());
        }

        if let Some(ref ver) = update.encryption_version {
            query.push_str(&format!(", encryption_version = ?{}", sql_params.len() + 1));
            sql_params.push((*ver).into());
        }

        if let Some(ref blob) = update.encrypted_blob {
            query.push_str(&format!(", encrypted_blob = ?{}", sql_params.len() + 1));
            sql_params.push(blob.clone().into());
        }

        if let Some(ref n) = update.nonce {
            query.push_str(&format!(", nonce = ?{}", sql_params.len() + 1));
            sql_params.push(n.clone().into());
        }

        query.push_str(&format!(
            " WHERE id = ?{} RETURNING *",
            sql_params.len() + 1
        ));
        sql_params.push(id.into());

        let mut stmt = conn.prepare(&query)?;
        let clip = stmt.query_row(rusqlite::params_from_iter(sql_params), row_to_clip)?;
        Ok(clip)
    }

    fn delete(&self, id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("DELETE FROM clips WHERE id = ?1")?;
        stmt.execute(params![id])?;
        Ok(())
    }

    fn find_by_hash(&self, hash: &str) -> Result<Option<Clip>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare(
            "SELECT * FROM clips WHERE content_hash = ?1 ORDER BY created_at DESC LIMIT 1",
        )?;
        let clip = stmt.query_row(params![hash], row_to_clip).optional()?;
        Ok(clip)
    }

    fn set_favorite(&self, id: i64, favorite: bool) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn
            .prepare("UPDATE clips SET is_favorite = ?1, updated_at = unixepoch() WHERE id = ?2")?;
        stmt.execute(params![if favorite { 1 } else { 0 }, id])?;
        Ok(())
    }

    fn set_pinned(&self, id: i64, pinned: bool) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn
            .prepare("UPDATE clips SET is_pinned = ?1, updated_at = unixepoch() WHERE id = ?2")?;
        stmt.execute(params![if pinned { 1 } else { 0 }, id])?;
        Ok(())
    }

    fn touch(&self, id: i64) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("UPDATE clips SET updated_at = unixepoch() WHERE id = ?1")?;
        stmt.execute(params![id])?;
        Ok(())
    }

    fn prune_older_than(&self, max_age_secs: i64) -> Result<u64, AppError> {
        let conn = self.db.conn()?;
        let cutoff = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| AppError::Internal(e.to_string()))?
            .as_secs() as i64
            - max_age_secs;

        let mut stmt = conn.prepare(
            "DELETE FROM clips WHERE is_favorite = 0 AND is_pinned = 0 AND created_at < ?1",
        )?;
        let count = stmt.execute(params![cutoff])?;
        Ok(count as u64)
    }

    fn count(&self) -> Result<u64, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM clips")?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as u64)
    }

    fn get_encrypted_clips(&self) -> Result<Vec<Clip>, AppError> {
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT * FROM clips WHERE is_encrypted = 1")?;
        let clip_iter = stmt.query_map([], row_to_clip)?;

        let mut clips = Vec::new();
        for clip_result in clip_iter {
            clips.push(clip_result?);
        }

        Ok(clips)
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
    fn test_clip_crud() {
        let db = setup_test_db();
        let repo = SqliteClipRepo::new(db);

        let new_clip = NewClip {
            content_text: Some("test content".into()),
            content_html: None,
            content_rtf: None,
            image_path: None,
            content_type: ContentType::Text,
            category: "plain_text".into(),
            source_app: None,
            content_hash: "hash123".into(),
            preview: Some("test...".into()),
            char_count: 12,
            line_count: 1,
            language: None,
            is_code: false,
            detection_confidence: 0.0,
            language_source: "auto".to_string(),
            is_encrypted: false,
            encryption_version: None,
            encrypted_blob: None,
            nonce: None,
        };

        // Create
        let clip = repo.create(&new_clip).unwrap();
        assert_eq!(clip.content_text.unwrap(), "test content");
        assert_eq!(clip.id, 1);

        // Get
        let fetched = repo.get_by_id(1).unwrap().unwrap();
        assert_eq!(fetched.content_hash, "hash123");

        // Update
        let update = ClipUpdate {
            is_favorite: Some(true),
            is_pinned: None,
            language: None,
            language_source: None,
            ..Default::default()
        };
        let updated = repo.update(1, &update).unwrap();
        assert!(updated.is_favorite);

        // List
        let params = ListParams::default();
        let list = repo.list(&params).unwrap();
        assert_eq!(list.len(), 1);

        // Delete
        repo.delete(1).unwrap();
        assert!(repo.get_by_id(1).unwrap().is_none());
    }
}
