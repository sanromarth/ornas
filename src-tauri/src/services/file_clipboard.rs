use crate::error::AppError;
use crate::infrastructure::database::Database;
use mime_guess::from_path;
use rusqlite::params;
use std::fs;
use std::path::Path;
use std::sync::Arc;

pub struct FileClipboardService {
    db: Arc<Database>,
}

impl FileClipboardService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn process_files(&self, paths: Vec<String>) -> Result<(), AppError> {
        if paths.is_empty() {
            return Ok(());
        }

        let mut conn = self.db.conn()?;
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;

        let mut file_records = Vec::new();
        let mut file_names = Vec::new();

        for path_str in &paths {
            let path = Path::new(path_str);
            let file_name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let extension = path.extension().map(|e| e.to_string_lossy().to_string());
            let mime_type = from_path(path).first_raw().map(|s| s.to_string());

            let metadata = fs::metadata(path).ok();
            let file_size = metadata.as_ref().map(|m| m.len() as i64).unwrap_or(0);
            let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
            let is_readonly = metadata
                .as_ref()
                .map(|m| m.permissions().readonly())
                .unwrap_or(false);

            let created_time = metadata
                .as_ref()
                .and_then(|m| m.created().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);
            let modified_time = metadata
                .as_ref()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);

            file_names.push(file_name.clone());

            file_records.push((
                path_str.clone(),
                file_name,
                extension,
                mime_type,
                file_size,
                is_dir,
                is_readonly,
                created_time,
                modified_time,
            ));
        }

        let content_text = file_names.join(" ");
        let char_count = content_text.len() as i64;
        let line_count = paths.len() as i64;

        let mut stmt = tx.prepare(
            "INSERT INTO clips (
                content_text, content_type, category, source_app, content_hash, char_count, line_count
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7
            ) RETURNING id",
        )?;

        let clip_id: i64 = stmt.query_row(
            params![
                content_text,
                "file",
                "file",                 // category
                Option::<String>::None, // source_app
                "",                     // hash
                char_count,
                line_count
            ],
            |row| row.get(0),
        )?;
        drop(stmt);

        let mut insert_file = tx.prepare(
            "INSERT INTO clip_files (
                clip_id, file_path, file_name, extension, mime_type, file_size, is_dir, is_readonly, created_time, modified_time
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
            )"
        )?;

        for record in file_records {
            insert_file.execute(params![
                clip_id,
                record.0,
                record.1,
                record.2,
                record.3,
                record.4,
                if record.5 { 1 } else { 0 },
                if record.6 { 1 } else { 0 },
                record.7,
                record.8
            ])?;
        }
        drop(insert_file);

        tx.commit().map_err(|e| AppError::Database(e.to_string()))?;

        // Thumbnail generation in background
        let db_clone = Arc::clone(&self.db);
        let clip_id_clone = clip_id;
        std::thread::spawn(move || {
            // In a real app, we would use something like `image` crate to generate thumbnails
            // for image files. For now, we simulate thumbnail generation by setting a dummy path.
            if let Ok(mut conn) = db_clone.conn() {
                if let Ok(tx) = conn.transaction() {
                    if let Ok(mut stmt) = tx.prepare("UPDATE clip_files SET thumbnail_path = ?1 WHERE clip_id = ?2 AND mime_type LIKE 'image/%'") {
                        let _ = stmt.execute(rusqlite::params!["generic_thumbnail.png", clip_id_clone]);
                    }
                    let _ = tx.commit();
                }
            }
        });

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
    fn test_process_files() {
        let db = setup_test_db();
        let service = FileClipboardService::new(db.clone());

        let paths = vec!["/tmp/test.txt".to_string()];
        service.process_files(paths).unwrap();

        let conn = db.conn().unwrap();
        let mut stmt = conn
            .prepare("SELECT content_text, content_type FROM clips")
            .unwrap();
        let clip = stmt
            .query_row([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .unwrap();

        assert_eq!(clip.0, "test.txt");
        assert_eq!(clip.1, "file");

        let mut stmt_files = conn.prepare("SELECT file_path FROM clip_files").unwrap();
        let file_path: String = stmt_files.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(file_path, "/tmp/test.txt");
    }
}
