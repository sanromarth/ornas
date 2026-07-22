//! SQLite implementation of SearchRepository.
//!
//! Handles FTS5 full-text search queries and index maintenance.

use crate::domain::clip::Clip;
use crate::domain::traits::SearchRepository;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use rusqlite::params;
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
    fn search(&self, query: &str, limit: u32) -> Result<Vec<Clip>, AppError> {
        let conn = self.db.conn()?;

        let mut stmt = conn.prepare(
            "SELECT c.* 
             FROM clips c 
             JOIN clips_fts fts ON c.id = fts.rowid 
             WHERE clips_fts MATCH ?1 
             ORDER BY rank 
             LIMIT ?2",
        )?;

        let clip_iter = stmt.query_map(
            params![query, limit],
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
        };
        clip_repo.create(&new_clip).unwrap();

        let results = search_repo.search("hello", 10).unwrap();
        assert_eq!(results.len(), 1);

        search_repo.optimize_index().unwrap();
        search_repo.rebuild_index().unwrap();
    }
}
