//! Image file storage — save and load clipboard images.
//!
//! Images are stored on the filesystem, not in the database.
//! Only the relative file path is persisted in the `clips.image_path` column.
//! Files are named by content hash to enable natural dedup.
//!
//! Directory layout:
//! ```text
//! {base_path}/
//!   {hash}.png          — full-size clipboard images
//!   thumbnails/
//!     {hash}.png        — 256px max-dimension thumbnails
//! ```

use crate::error::AppError;
use std::path::{Path, PathBuf};

/// Maximum thumbnail dimension (width or height) in pixels.
const THUMBNAIL_MAX_DIM: u32 = 256;

/// Manages clipboard image storage on the local filesystem.
///
/// Images are saved as `{hash}.png` in the base directory.
/// Thumbnails are saved as `thumbnails/{hash}.png`.
pub struct ImageStore {
    /// Root directory for image storage (e.g., ~/.local/share/ornas/images/).
    base_path: PathBuf,
    /// Subdirectory for cached thumbnails.
    thumbnail_path: PathBuf,
}

impl ImageStore {
    /// Creates a new image store at the given directory.
    ///
    /// Creates the directory and thumbnail subdirectory if they do not exist.
    pub fn new(base_path: PathBuf) -> Result<Self, AppError> {
        let thumbnail_path = base_path.join("thumbnails");
        std::fs::create_dir_all(&base_path)?;
        std::fs::create_dir_all(&thumbnail_path)?;
        Ok(Self {
            base_path,
            thumbnail_path,
        })
    }

    /// Returns the base path for image storage.
    #[allow(dead_code)]
    pub fn base_path(&self) -> &Path {
        &self.base_path
    }

    /// Saves image bytes to the filesystem using the hash as filename.
    ///
    /// Returns the relative path suitable for storing in the database.
    pub fn save(&self, hash: &str, bytes: &[u8]) -> Result<String, AppError> {
        let filename = format!("{hash}.png");
        let full_path = self.base_path.join(&filename);

        std::fs::write(&full_path, bytes)?;
        tracing::debug!(path = %full_path.display(), size = bytes.len(), "image saved");

        Ok(filename)
    }

    /// Generates and saves a thumbnail for the given image bytes.
    ///
    /// Uses the `image` crate to decode the source image, resize it to fit
    /// within [`THUMBNAIL_MAX_DIM`] pixels (preserving aspect ratio), and
    /// save the result as PNG in the thumbnails subdirectory.
    ///
    /// Returns the relative path `thumbnails/{hash}.png` on success, or
    /// `None` if the image could not be decoded (unsupported format).
    ///
    /// This operation is idempotent: if the thumbnail already exists, it
    /// returns the path without regenerating.
    pub fn generate_thumbnail(&self, hash: &str, bytes: &[u8]) -> Option<String> {
        let relative = format!("thumbnails/{hash}.png");
        let full_path = self.thumbnail_path.join(format!("{hash}.png"));

        // Reuse cached thumbnail if it already exists
        if full_path.exists() {
            tracing::debug!(path = %full_path.display(), "thumbnail cache hit");
            return Some(relative);
        }

        match image::load_from_memory(bytes) {
            Ok(img) => {
                let thumb = img.thumbnail(THUMBNAIL_MAX_DIM, THUMBNAIL_MAX_DIM);
                match thumb.save_with_format(&full_path, image::ImageFormat::Png) {
                    Ok(()) => {
                        tracing::debug!(
                            path = %full_path.display(),
                            width = thumb.width(),
                            height = thumb.height(),
                            "thumbnail generated"
                        );
                        Some(relative)
                    }
                    Err(e) => {
                        tracing::warn!("Failed to save thumbnail: {e}");
                        None
                    }
                }
            }
            Err(e) => {
                tracing::debug!("Cannot decode image for thumbnail: {e}");
                None
            }
        }
    }

    /// Reads image bytes from a file on disk.
    ///
    /// Used by `FileClipboardService` to read an image file that was copied
    /// from a file manager so it can be stored in the image cache.
    pub fn read_file_bytes(path: &Path) -> Result<Vec<u8>, AppError> {
        let bytes = std::fs::read(path)?;
        tracing::debug!(
            path = %path.display(),
            size = bytes.len(),
            "image file read for caching"
        );
        Ok(bytes)
    }

    /// Deletes an image file by its relative path.
    #[allow(dead_code)]
    pub fn delete(&self, relative_path: &str) -> Result<(), AppError> {
        let full_path = self.base_path.join(relative_path);
        if full_path.exists() {
            std::fs::remove_file(&full_path)?;
            tracing::debug!(path = %full_path.display(), "image deleted");
        }
        Ok(())
    }

    /// Returns the full filesystem path for a relative image path.
    #[allow(dead_code)]
    pub fn path_for(&self, relative_path: &str) -> PathBuf {
        self.base_path.join(relative_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_image_save_and_delete() {
        let dir = std::env::temp_dir().join("ornas_test_images");
        let store = ImageStore::new(dir.clone()).unwrap();

        let bytes = vec![0x89, 0x50, 0x4e, 0x47]; // PNG magic bytes
        let relative = store.save("testhash", &bytes).unwrap();
        assert_eq!(relative, "testhash.png");

        let full = store.path_for(&relative);
        assert!(full.exists());
        assert_eq!(fs::read(&full).unwrap(), bytes);

        store.delete(&relative).unwrap();
        assert!(!full.exists());

        // Cleanup
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_delete_nonexistent() {
        let dir = std::env::temp_dir().join("ornas_test_images_2");
        let store = ImageStore::new(dir.clone()).unwrap();
        // Should not error when file doesn't exist
        let result = store.delete("nonexistent.png");
        assert!(result.is_ok());
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_thumbnail_directory_created() {
        let dir = std::env::temp_dir().join("ornas_test_images_3");
        let _ = fs::remove_dir_all(&dir);
        let store = ImageStore::new(dir.clone()).unwrap();
        assert!(store.thumbnail_path.exists());
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn test_generate_thumbnail_invalid_bytes() {
        let dir = std::env::temp_dir().join("ornas_test_images_4");
        let store = ImageStore::new(dir.clone()).unwrap();
        // Invalid image bytes should return None, not panic
        let result = store.generate_thumbnail("badimage", &[0x00, 0x01, 0x02]);
        assert!(result.is_none());
        let _ = fs::remove_dir_all(dir);
    }
}
