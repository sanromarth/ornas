use crate::domain::clip::{Clip, ContentType};
use crate::domain::collection::Collection;
use crate::domain::tag::Tag;
use crate::error::AppError;
use crate::infrastructure::database::Database;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use zip::CompressionMethod;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Serialize, Deserialize, Debug)]
pub struct Manifest {
    pub ornas_version: String,
    pub backup_version: String,
    pub schema_version: String,
    pub timestamp: i64,
    pub platform: String,
    pub os_version: String,
    pub db_engine: String,
    pub db_version: String,
    pub item_count: usize,
    pub image_count: usize,
    pub file_count: usize,
    pub checksum: String,
    pub compression_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BackupClipCollection {
    pub clip_id: i64,
    pub collection_id: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BackupClipTag {
    pub clip_id: i64,
    pub tag_id: i64,
}

pub struct BackupManager {
    db: Arc<Database>,
    image_store_path: PathBuf,
}

impl BackupManager {
    pub fn new(db: Arc<Database>, image_store_path: PathBuf) -> Self {
        Self {
            db,
            image_store_path,
        }
    }

    pub fn export(
        &self,
        export_path: &Path,
        _app_handle: tauri::AppHandle,
    ) -> Result<(), AppError> {
        let file = File::create(export_path)?;
        let mut zip = ZipWriter::new(file);

        let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

        // 1. Fetch Clips
        let conn = self.db.conn()?;
        let mut stmt = conn.prepare("SELECT id, content_text, content_html, content_rtf, image_path, content_type, category, source_app, content_hash, preview, char_count, line_count, is_favorite, is_pinned, language, is_code, detection_confidence, language_source, is_encrypted, encryption_version, encrypted_blob, nonce, created_at, updated_at FROM clips")?;

        let clips_iter = stmt.query_map([], |row| {
            let content_type_str: String = row.get(5)?;
            let content_type = match content_type_str.as_str() {
                "image" => ContentType::Image,
                "rich_text" => ContentType::RichText,
                _ => ContentType::Text,
            };

            Ok(Clip {
                id: row.get(0)?,
                content_text: row.get(1)?,
                content_html: row.get(2)?,
                content_rtf: row.get(3)?,
                image_path: row.get(4)?,
                content_type,
                category: row.get(6)?,
                source_app: row.get(7)?,
                content_hash: row.get(8)?,
                preview: row.get(9)?,
                char_count: row.get(10)?,
                line_count: row.get(11)?,
                is_favorite: row.get::<_, i64>(12)? > 0,
                is_pinned: row.get::<_, i64>(13)? > 0,
                language: row.get(14).unwrap_or(None),
                is_code: row.get::<_, i64>(15).unwrap_or(0) > 0,
                detection_confidence: row.get(16).unwrap_or(0.0),
                language_source: row.get(17).unwrap_or_else(|_| "auto".to_string()),
                is_encrypted: row.get::<_, i64>(18).unwrap_or(0) > 0,
                encryption_version: row.get(19).unwrap_or(None),
                encrypted_blob: row.get(20).unwrap_or(None),
                nonce: row.get(21).unwrap_or(None),
                created_at: row.get(22)?,
                updated_at: row.get(23)?,
                files: None,
            })
        })?;

        let mut clips = Vec::new();
        let mut image_count = 0;
        for clip in clips_iter.flatten() {
            if clip.image_path.is_some() {
                image_count += 1;
            }
            clips.push(clip);
        }

        let item_count = clips.len();

        // Settings
        let mut stmt = conn.prepare("SELECT key, value, updated_at FROM settings")?;
        let settings_iter = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })?;
        let mut settings = Vec::new();
        for setting in settings_iter.flatten() {
            settings.push(setting);
        }

        // Clip files
        let mut stmt = conn.prepare("SELECT id, clip_id, file_path, file_name, extension, mime_type, file_size, is_dir, is_readonly, created_time, modified_time, hash, thumbnail_path, status, selection_group, icon_type, created_at, updated_at FROM clip_files")?;
        let clip_files_iter = stmt.query_map([], |row| {
            Ok(crate::domain::clip::ClipFile {
                id: row.get(0)?,
                clip_id: row.get(1)?,
                file_path: row.get(2)?,
                file_name: row.get(3)?,
                extension: row.get(4)?,
                mime_type: row.get(5)?,
                file_size: row.get(6)?,
                is_dir: row.get::<_, i64>(7)? > 0,
                is_readonly: row.get::<_, i64>(8)? > 0,
                created_time: row.get(9)?,
                modified_time: row.get(10)?,
                hash: row.get(11)?,
                thumbnail_path: row.get(12)?,
                status: row.get(13)?,
                selection_group: row.get(14)?,
                icon_type: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        })?;
        let mut clip_files = Vec::new();
        for file in clip_files_iter.flatten() {
            clip_files.push(file);
        }
        let file_count = clip_files.len();

        // write clipboard.json
        zip.start_file("clipboard.json", options)?;
        let clips_json =
            serde_json::to_string_pretty(&clips).map_err(|e| AppError::Internal(e.to_string()))?;
        zip.write_all(clips_json.as_bytes())?;

        // write settings.json
        zip.start_file("settings.json", options)?;
        let settings_json = serde_json::to_string_pretty(&settings)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        zip.write_all(settings_json.as_bytes())?;

        // write clip_files.json
        zip.start_file("clip_files.json", options)?;
        let clip_files_json = serde_json::to_string_pretty(&clip_files)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        zip.write_all(clip_files_json.as_bytes())?;

        // Collections
        let mut stmt =
            conn.prepare("SELECT id, name, icon, color, sort_order, created_at FROM collections")?;
        let cols_iter = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        let mut collections = Vec::new();
        for col in cols_iter.flatten() {
            collections.push(col);
        }
        zip.start_file("collections.json", options)?;
        zip.write_all(
            serde_json::to_string_pretty(&collections)
                .map_err(|e| AppError::Internal(e.to_string()))?
                .as_bytes(),
        )?;

        // Tags
        let mut stmt = conn.prepare("SELECT id, name, color FROM tags")?;
        let tags_iter = stmt.query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })?;
        let mut tags = Vec::new();
        for tag in tags_iter.flatten() {
            tags.push(tag);
        }
        zip.start_file("tags.json", options)?;
        zip.write_all(
            serde_json::to_string_pretty(&tags)
                .map_err(|e| AppError::Internal(e.to_string()))?
                .as_bytes(),
        )?;

        // Clip-Collections
        let mut stmt = conn.prepare("SELECT clip_id, collection_id FROM clip_collections")?;
        let cc_iter = stmt.query_map([], |row| {
            Ok(BackupClipCollection {
                clip_id: row.get(0)?,
                collection_id: row.get(1)?,
            })
        })?;
        let mut clip_collections = Vec::new();
        for c in cc_iter.flatten() {
            clip_collections.push(c);
        }
        zip.start_file("clip_collections.json", options)?;
        zip.write_all(
            serde_json::to_string_pretty(&clip_collections)
                .map_err(|e| AppError::Internal(e.to_string()))?
                .as_bytes(),
        )?;

        // Clip-Tags
        let mut stmt = conn.prepare("SELECT clip_id, tag_id FROM clip_tags")?;
        let ct_iter = stmt.query_map([], |row| {
            Ok(BackupClipTag {
                clip_id: row.get(0)?,
                tag_id: row.get(1)?,
            })
        })?;
        let mut clip_tags = Vec::new();
        for c in ct_iter.flatten() {
            clip_tags.push(c);
        }
        zip.start_file("clip_tags.json", options)?;
        zip.write_all(
            serde_json::to_string_pretty(&clip_tags)
                .map_err(|e| AppError::Internal(e.to_string()))?
                .as_bytes(),
        )?;

        // copy images
        zip.add_directory("images/", options)?;
        for clip in &clips {
            if let Some(ref img_name) = clip.image_path {
                let img_path = self.image_store_path.join(img_name);
                if img_path.exists() {
                    zip.start_file(format!("images/{}", img_name), options)?;
                    let mut img_file = File::open(&img_path)?;
                    let mut buffer = Vec::new();
                    img_file.read_to_end(&mut buffer)?;
                    zip.write_all(&buffer)?;
                }
            }
        }

        // Add files directory
        zip.add_directory("files/", options)?;

        // write manifest
        let manifest = Manifest {
            ornas_version: env!("CARGO_PKG_VERSION").to_string(),
            backup_version: "1.0".to_string(),
            schema_version: "1.0".to_string(), // we can query pragma user_version, but hardcoding for simplicity
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
            platform: std::env::consts::OS.to_string(),
            os_version: std::env::consts::ARCH.to_string(),
            db_engine: "sqlite".to_string(),
            db_version: "3".to_string(),
            item_count,
            image_count,
            file_count,
            checksum: "TODO".to_string(),
            compression_type: "deflate".to_string(),
        };

        zip.start_file("manifest.json", options)?;
        let manifest_json = serde_json::to_string_pretty(&manifest)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        zip.write_all(manifest_json.as_bytes())?;

        zip.finish()?;

        Ok(())
    }

    pub fn import(
        &self,
        import_path: &Path,
        mode: &str,
        _app_handle: tauri::AppHandle,
    ) -> Result<(), AppError> {
        let file = File::open(import_path)?;
        let mut archive = ZipArchive::new(file)?;

        // Find manifest
        let mut manifest_str = String::new();
        {
            let mut manifest_file = archive.by_name("manifest.json")?;
            manifest_file.read_to_string(&mut manifest_str)?;
        }
        let manifest: Manifest =
            serde_json::from_str(&manifest_str).map_err(|e| AppError::Internal(e.to_string()))?;

        if manifest.backup_version != "1.0" {
            return Err(AppError::Internal("Unsupported backup version".into()));
        }

        // Find clipboard.json
        let mut clips_str = String::new();
        {
            let mut clips_file = archive.by_name("clipboard.json")?;
            clips_file.read_to_string(&mut clips_str)?;
        }
        let clips: Vec<Clip> =
            serde_json::from_str(&clips_str).map_err(|e| AppError::Internal(e.to_string()))?;

        // Find settings.json
        let mut settings_str = String::new();
        {
            if let Ok(mut settings_file) = archive.by_name("settings.json") {
                settings_file.read_to_string(&mut settings_str)?;
            }
        }
        let settings: Vec<(String, String, i64)> = if !settings_str.is_empty() {
            serde_json::from_str(&settings_str).map_err(|e| AppError::Internal(e.to_string()))?
        } else {
            Vec::new()
        };

        // Find clip_files.json
        let mut clip_files_str = String::new();
        if let Ok(mut cf_file) = archive.by_name("clip_files.json") {
            cf_file.read_to_string(&mut clip_files_str)?;
        }
        let clip_files: Vec<crate::domain::clip::ClipFile> = if !clip_files_str.is_empty() {
            serde_json::from_str(&clip_files_str).map_err(|e| AppError::Internal(e.to_string()))?
        } else {
            Vec::new()
        };

        // Find collections.json
        let mut collections_str = String::new();
        if let Ok(mut f) = archive.by_name("collections.json") {
            f.read_to_string(&mut collections_str)?;
        }
        let collections: Vec<Collection> = if !collections_str.is_empty() {
            serde_json::from_str(&collections_str).unwrap_or_default()
        } else {
            Vec::new()
        };

        // Find tags.json
        let mut tags_str = String::new();
        if let Ok(mut f) = archive.by_name("tags.json") {
            f.read_to_string(&mut tags_str)?;
        }
        let tags: Vec<Tag> = if !tags_str.is_empty() {
            serde_json::from_str(&tags_str).unwrap_or_default()
        } else {
            Vec::new()
        };

        // Find clip_collections.json
        let mut cc_str = String::new();
        if let Ok(mut f) = archive.by_name("clip_collections.json") {
            f.read_to_string(&mut cc_str)?;
        }
        let clip_collections: Vec<BackupClipCollection> = if !cc_str.is_empty() {
            serde_json::from_str(&cc_str).unwrap_or_default()
        } else {
            Vec::new()
        };

        // Find clip_tags.json
        let mut ct_str = String::new();
        if let Ok(mut f) = archive.by_name("clip_tags.json") {
            f.read_to_string(&mut ct_str)?;
        }
        let clip_tags: Vec<BackupClipTag> = if !ct_str.is_empty() {
            serde_json::from_str(&ct_str).unwrap_or_default()
        } else {
            Vec::new()
        };

        let mut conn = self.db.conn()?;
        let tx = conn.transaction()?;

        if mode == "replace_all" {
            tx.execute("DELETE FROM clips", [])?;
            tx.execute("DELETE FROM collections", [])?;
            tx.execute("DELETE FROM tags", [])?;
            tx.execute("DELETE FROM clip_collections", [])?;
            tx.execute("DELETE FROM clip_tags", [])?;
            tx.execute("DELETE FROM settings", [])?;
            tx.execute("DELETE FROM clip_files", [])?;

            // clear image dir
            if self.image_store_path.exists() {
                let _ = fs::remove_dir_all(&self.image_store_path);
            }
            fs::create_dir_all(&self.image_store_path)?;
        }

        // Import clips
        {
            let mut stmt = tx.prepare("INSERT INTO clips (
                id, content_text, content_html, content_rtf, image_path, content_type, category, source_app, content_hash, preview, char_count, line_count, is_favorite, is_pinned, language, is_code, detection_confidence, language_source, is_encrypted, encryption_version, encrypted_blob, nonce, created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24
            ) ON CONFLICT(id) DO UPDATE SET
                content_text=excluded.content_text,
                content_html=excluded.content_html,
                content_rtf=excluded.content_rtf,
                image_path=excluded.image_path,
                content_type=excluded.content_type,
                category=excluded.category,
                source_app=excluded.source_app,
                content_hash=excluded.content_hash,
                preview=excluded.preview,
                char_count=excluded.char_count,
                line_count=excluded.line_count,
                is_favorite=excluded.is_favorite,
                is_pinned=excluded.is_pinned,
                language=excluded.language,
                is_code=excluded.is_code,
                detection_confidence=excluded.detection_confidence,
                language_source=excluded.language_source,
                is_encrypted=excluded.is_encrypted,
                encryption_version=excluded.encryption_version,
                encrypted_blob=excluded.encrypted_blob,
                nonce=excluded.nonce,
                updated_at=excluded.updated_at
            ")?;

            for clip in &clips {
                let content_type = clip.content_type.as_str();
                stmt.execute(rusqlite::params![
                    clip.id,
                    clip.content_text,
                    clip.content_html,
                    clip.content_rtf,
                    clip.image_path,
                    content_type,
                    clip.category,
                    clip.source_app,
                    clip.content_hash,
                    clip.preview,
                    clip.char_count,
                    clip.line_count,
                    clip.is_favorite as i64,
                    clip.is_pinned as i64,
                    clip.language,
                    clip.is_code as i64,
                    clip.detection_confidence,
                    clip.language_source,
                    clip.is_encrypted as i64,
                    clip.encryption_version,
                    clip.encrypted_blob,
                    clip.nonce,
                    clip.created_at,
                    clip.updated_at
                ])?;
            }
        }

        // Import settings
        {
            let mut stmt = tx.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")?;
            for s in &settings {
                stmt.execute(rusqlite::params![s.0, s.1, s.2])?;
            }
        }

        // Import clip files
        {
            let mut stmt = tx.prepare("INSERT INTO clip_files (
                id, clip_id, file_path, file_name, extension, mime_type, file_size, is_dir, is_readonly, created_time, modified_time, hash, thumbnail_path, status, selection_group, icon_type, created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18
            ) ON CONFLICT(id) DO UPDATE SET
                clip_id=excluded.clip_id,
                file_path=excluded.file_path,
                file_name=excluded.file_name,
                extension=excluded.extension,
                mime_type=excluded.mime_type,
                file_size=excluded.file_size,
                is_dir=excluded.is_dir,
                is_readonly=excluded.is_readonly,
                created_time=excluded.created_time,
                modified_time=excluded.modified_time,
                hash=excluded.hash,
                thumbnail_path=excluded.thumbnail_path,
                status=excluded.status,
                selection_group=excluded.selection_group,
                icon_type=excluded.icon_type,
                updated_at=excluded.updated_at
            ")?;

            for cf in &clip_files {
                stmt.execute(rusqlite::params![
                    cf.id,
                    cf.clip_id,
                    cf.file_path,
                    cf.file_name,
                    cf.extension,
                    cf.mime_type,
                    cf.file_size,
                    cf.is_dir as i64,
                    cf.is_readonly as i64,
                    cf.created_time,
                    cf.modified_time,
                    cf.hash,
                    cf.thumbnail_path,
                    cf.status,
                    cf.selection_group,
                    cf.icon_type,
                    cf.created_at,
                    cf.updated_at
                ])?;
            }
        }

        // Import collections
        {
            let mut stmt = tx.prepare("INSERT INTO collections (id, name, icon, color, sort_order, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, color=excluded.color, sort_order=excluded.sort_order")?;
            for col in &collections {
                stmt.execute(rusqlite::params![
                    col.id,
                    col.name,
                    col.icon,
                    col.color,
                    col.sort_order,
                    col.created_at
                ])?;
            }
        }

        // Import tags
        {
            let mut stmt = tx.prepare("INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color")?;
            for tag in &tags {
                stmt.execute(rusqlite::params![tag.id, tag.name, tag.color])?;
            }
        }

        // Import clip_collections
        {
            let mut stmt = tx.prepare(
                "INSERT OR IGNORE INTO clip_collections (clip_id, collection_id) VALUES (?1, ?2)",
            )?;
            for cc in &clip_collections {
                stmt.execute(rusqlite::params![cc.clip_id, cc.collection_id])?;
            }
        }

        // Import clip_tags
        {
            let mut stmt =
                tx.prepare("INSERT OR IGNORE INTO clip_tags (clip_id, tag_id) VALUES (?1, ?2)")?;
            for ct in &clip_tags {
                stmt.execute(rusqlite::params![ct.clip_id, ct.tag_id])?;
            }
        }

        tx.commit()?;

        // Extract images
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            if file.is_file() && file.name().starts_with("images/") {
                if let Some(filename) = std::path::Path::new(file.name()).file_name() {
                    let dest = self.image_store_path.join(filename);
                    if let Ok(mut out) = File::create(dest) {
                        std::io::copy(&mut file, &mut out)?;
                    }
                }
            }
        }

        Ok(())
    }
}
