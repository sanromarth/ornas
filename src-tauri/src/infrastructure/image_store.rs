//! Image file storage — save and load clipboard images.
//!
//! Images are stored on the filesystem, not in the database.
//! Only the relative file path is persisted in the `clips.image_path` column.

use std::path::PathBuf;

/// Manages clipboard image storage on the local filesystem.
pub struct ImageStore {
    /// Root directory for image storage (e.g., ~/.local/share/ornas/images/).
    base_path: PathBuf,
}

impl ImageStore {
    /// Creates a new image store at the given directory.
    pub fn new(base_path: PathBuf) -> Self {
        Self { base_path }
    }

    /// Returns the base path for image storage.
    pub fn base_path(&self) -> &PathBuf {
        &self.base_path
    }
}
