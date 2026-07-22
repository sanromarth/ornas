//! Image file storage — save and load clipboard images.
//!
//! Images are stored on the filesystem, not in the database.
//! Only the relative file path is persisted in the `clips.image_path` column.
//! Files are named by content hash to enable natural dedup.

use crate::error::AppError;
use std::path::{Path, PathBuf};

/// Manages clipboard image storage on the local filesystem.
///
/// Images are saved as `{hash}.png` in the base directory.
pub struct ImageStore {
    /// Root directory for image storage (e.g., ~/.local/share/ornas/images/).
    base_path: PathBuf,
}

impl ImageStore {
    /// Creates a new image store at the given directory.
    ///
    /// Creates the directory if it does not exist.
    pub fn new(base_path: PathBuf) -> Result<Self, AppError> {
        std::fs::create_dir_all(&base_path)?;
        Ok(Self { base_path })
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
}
