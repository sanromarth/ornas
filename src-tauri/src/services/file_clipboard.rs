//! File Clipboard Service — processes file references from the clipboard.
//!
//! When a user copies files from a file manager (Nautilus, Explorer, Finder),
//! this service receives the file paths and:
//!
//! 1. Detects whether the copied file is a single raster image
//! 2. If single image: classifies as `content_type = 'image'`, generates a
//!    thumbnail, caches the image in ImageStore, and stores the original
//!    file reference in `clip_files`
//! 3. If multiple files or non-image: classifies as `content_type = 'file'`
//!    with metadata in `clip_files` and generates thumbnails for any images
//!
//! The distinction between "clipboard image" (raw bytes from a screenshot) and
//! "image file" (file reference with path/metadata) is preserved in the database:
//! - Clipboard images: `content_type = 'image'`, no `clip_files` rows
//! - Image files: `content_type = 'image'`, `clip_files` rows with metadata

use crate::error::AppError;
use crate::infrastructure::database::Database;
use crate::infrastructure::image_store::ImageStore;
use mime_guess::from_path;
use rusqlite::params;
use std::fs;
use std::path::Path;
use std::sync::Arc;

/// MIME types recognized as raster images for thumbnail generation.
const IMAGE_MIME_PREFIXES: [&str; 6] = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
];

/// Checks whether a MIME type string represents a raster image.
fn is_raster_image_mime(mime: &str) -> bool {
    IMAGE_MIME_PREFIXES.contains(&mime)
}

pub struct FileClipboardService {
    db: Arc<Database>,
    image_store: Arc<ImageStore>,
}

impl FileClipboardService {
    pub fn new(db: Arc<Database>, image_store: Arc<ImageStore>) -> Self {
        Self { db, image_store }
    }

    pub fn process_files(&self, paths: Vec<String>) -> Result<(), AppError> {
        if paths.is_empty() {
            return Ok(());
        }

        // Build metadata for each file
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

        // Determine if this is a single image file
        let is_single_image = file_records.len() == 1
            && !file_records[0].5 // not a directory
            && file_records[0]
                .3
                .as_deref()
                .is_some_and(is_raster_image_mime);

        // For single image files: cache the image and classify as 'image'
        let (content_type, category, image_path) = if is_single_image {
            let file_path = Path::new(&file_records[0].0);
            match ImageStore::read_file_bytes(file_path) {
                Ok(bytes) => {
                    // Generate content hash for dedup and filename
                    let hash = format!("{:016x}", xxhash_rust::xxh64::xxh64(&bytes, 0));

                    // Save the image to the image store
                    match self.image_store.save(&hash, &bytes) {
                        Ok(relative_path) => {
                            // Generate thumbnail in the background
                            self.image_store.generate_thumbnail(&hash, &bytes);

                            tracing::info!(
                                path = %file_path.display(),
                                hash = %hash,
                                "Image file cached and classified as image clip"
                            );

                            ("image", "plain_text", Some(relative_path))
                        }
                        Err(e) => {
                            tracing::warn!("Failed to cache image file: {e}");
                            ("file", "file", None)
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to read image file: {e}");
                    ("file", "file", None)
                }
            }
        } else {
            ("file", "file", None)
        };

        // Persist to database
        let mut conn = self.db.conn()?;
        let tx = conn
            .transaction()
            .map_err(|e| AppError::Database(e.to_string()))?;

        let content_text = file_names.join(" ");
        let char_count = content_text.len() as i64;
        let line_count = paths.len() as i64;

        let mut stmt = tx.prepare(
            "INSERT INTO clips (
                content_text, content_type, category, source_app, content_hash,
                char_count, line_count, image_path
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
            ) RETURNING id",
        )?;

        // Generate a hash for dedup (based on file paths for file clips)
        let content_hash = if is_single_image && image_path.is_some() {
            // For image files, the hash was already computed from the file bytes above
            let file_path = Path::new(&file_records[0].0);
            if let Ok(bytes) = fs::read(file_path) {
                format!("{:016x}", xxhash_rust::xxh64::xxh64(&bytes, 0))
            } else {
                format!(
                    "{:016x}",
                    xxhash_rust::xxh64::xxh64(content_text.as_bytes(), 0)
                )
            }
        } else {
            format!(
                "{:016x}",
                xxhash_rust::xxh64::xxh64(content_text.as_bytes(), 0)
            )
        };

        let clip_id: i64 = stmt.query_row(
            params![
                content_text,
                content_type,
                category,
                Option::<String>::None, // source_app
                content_hash,
                char_count,
                line_count,
                image_path
            ],
            |row| row.get(0),
        )?;
        drop(stmt);

        // Insert clip_files records (preserving file metadata regardless of classification)
        let mut insert_file = tx.prepare(
            "INSERT INTO clip_files (
                clip_id, file_path, file_name, extension, mime_type, file_size,
                is_dir, is_readonly, created_time, modified_time
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10
            )",
        )?;

        for record in &file_records {
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

        // Generate thumbnails for image files in multi-file selections (async, non-blocking)
        if !is_single_image {
            let image_store = Arc::clone(&self.image_store);
            let records_for_thumb: Vec<_> = file_records
                .iter()
                .filter(|r| r.3.as_deref().is_some_and(is_raster_image_mime))
                .map(|r| (r.0.clone(), clip_id))
                .collect();

            if !records_for_thumb.is_empty() {
                let db_clone = Arc::clone(&self.db);
                std::thread::spawn(move || {
                    for (path_str, cid) in &records_for_thumb {
                        let file_path = Path::new(path_str);
                        if let Ok(bytes) = fs::read(file_path) {
                            let hash = format!("{:016x}", xxhash_rust::xxh64::xxh64(&bytes, 0));
                            if let Some(thumb_path) = image_store.generate_thumbnail(&hash, &bytes)
                            {
                                // Update the clip_files record with the thumbnail path
                                if let Ok(conn) = db_clone.conn() {
                                    let _ = conn.execute(
                                        "UPDATE clip_files SET thumbnail_path = ?1 WHERE clip_id = ?2 AND file_path = ?3",
                                        rusqlite::params![thumb_path, cid, path_str],
                                    );
                                }
                            }
                        }
                    }
                });
            }
        }

        tracing::info!(
            clip_id = clip_id,
            content_type = content_type,
            file_count = file_records.len(),
            "File clipboard processed"
        );

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

    fn setup_test_image_store() -> Arc<ImageStore> {
        let dir = std::env::temp_dir().join("ornas_test_file_clipboard");
        Arc::new(ImageStore::new(dir).unwrap())
    }

    #[test]
    fn test_process_files() {
        let db = setup_test_db();
        let image_store = setup_test_image_store();
        let service = FileClipboardService::new(db.clone(), image_store);

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

    #[test]
    fn test_is_raster_image_mime() {
        assert!(is_raster_image_mime("image/png"));
        assert!(is_raster_image_mime("image/jpeg"));
        assert!(is_raster_image_mime("image/gif"));
        assert!(is_raster_image_mime("image/webp"));
        assert!(is_raster_image_mime("image/bmp"));
        assert!(is_raster_image_mime("image/tiff"));
        assert!(!is_raster_image_mime("image/svg+xml"));
        assert!(!is_raster_image_mime("application/pdf"));
        assert!(!is_raster_image_mime("text/plain"));
    }

    #[test]
    fn test_process_empty_files() {
        let db = setup_test_db();
        let image_store = setup_test_image_store();
        let service = FileClipboardService::new(db, image_store);

        let result = service.process_files(vec![]);
        assert!(result.is_ok());
    }
}
