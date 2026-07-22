//! SQLite implementation of SearchRepository.
//!
//! Handles FTS5 full-text search queries and index maintenance.

use crate::domain::clip::Clip;
use crate::domain::traits::{ListParams, SearchRepository};
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::params_from_iter;
use std::sync::Arc;

/// SQLite-backed search repository using FTS5.
pub struct SqliteSearchRepo {
    db: Arc<Database>,
}

impl SqliteSearchRepo {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

impl SearchRepository for SqliteSearchRepo {
    fn search(&self, query: &str, limit: u32, params: &ListParams) -> Result<Vec<Clip>, AppError> {
        let conn = self.db.conn()?;

        let mut sql = String::from(
            "SELECT c.* 
             FROM clips c 
             JOIN clips_fts fts ON c.id = fts.rowid"
        );

        if params.collection_id.is_some() {
            sql.push_str(" JOIN clip_collections cc ON c.id = cc.clip_id");
        }
        if params.tag_id.is_some() {
            sql.push_str(" JOIN clip_tags ct ON c.id = ct.clip_id");
        }

        sql.push_str(" WHERE clips_fts MATCH ?");
        
        let mut sql_params: Vec<rusqlite::types::Value> = vec![query.to_string().into()];

        if let Some(cat) = &params.category {
            sql.push_str(" AND c.category = ?");
            sql_params.push(cat.clone().into());
        }
        if params.favorites_only {
            sql.push_str(" AND c.is_favorite = 1");
        }
        if params.pinned_only {
            sql.push_str(" AND c.is_pinned = 1");
        }
        if let Some(col_id) = params.collection_id {
            sql.push_str(" AND cc.collection_id = ?");
            sql_params.push(col_id.into());
        }
        if let Some(tag_id) = params.tag_id {
            sql.push_str(" AND ct.tag_id = ?");
            sql_params.push(tag_id.into());
        }

        sql.push_str(" ORDER BY rank LIMIT ?");
        sql_params.push(limit.into());

        let mut stmt = conn.prepare(&sql)?;

        let clip_iter = stmt.query_map(
            params_from_iter(sql_params),
            crate::infrastructure::database::clip_repo::row_to_clip,
        )?;

        let mut clips = Vec::new();
        for clip_result in clip_iter {
            clips.push(clip_result?);
        }
        Ok(clips)
    }

    fn optimize_index(&self) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute("INSERT INTO clips_fts(clips_fts) VALUES('optimize')", [])?;
        Ok(())
    }

    fn rebuild_index(&self) -> Result<(), AppError> {
        let conn = self.db.conn()?;
        conn.execute("INSERT INTO clips_fts(clips_fts) VALUES('rebuild')", [])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::clip::{ContentType, NewClip};
    use crate::domain::traits::ClipRepository;
    use crate::infrastructure::database::clip_repo::SqliteClipRepo;
    use crate::infrastructure::database::connection::open_in_memory;
    use crate::infrastructure::database::migrations::run_migrations;

    fn setup_test_db() -> Arc<Database> {
        let mut conn = open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        Arc::new(Database::new(conn))
    }

    #[test]
    fn test_search() {
        let db = setup_test_db();
        let clip_repo = SqliteClipRepo::new(Arc::clone(&db));
        let search_repo = SqliteSearchRepo::new(db);

        let new_clip = NewClip {
            content_text: Some("hello world".into()),
            content_html: None,
            content_rtf: None,
            image_path: None,
            content_type: ContentType::Text,
            category: "plain_text".into(),
            source_app: None,
            content_hash: "hash".into(),
            preview: Some("hello world".into()),
            char_count: 11,
            line_count: 1,
            language: None,
            is_code: false,
            detection_confidence: 0.0,
            language_source: "auto".to_string(),
        };
        clip_repo.create(&new_clip).unwrap();

        let params = crate::domain::traits::ListParams::default();
        let results = search_repo.search("hello", 10, &params).unwrap();
        assert_eq!(results.len(), 1);

        search_repo.optimize_index().unwrap();
        search_repo.rebuild_index().unwrap();
    }
}
