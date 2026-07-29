use std::path::Path;

#[allow(dead_code)]
pub trait ClipboardBackend: Send + Sync {
    /// Read text from the system clipboard.
    fn read_text(&self) -> Result<Option<String>, String>;

    /// Read HTML from the system clipboard.
    fn read_html(&self) -> Result<Option<String>, String>;

    /// Read RTF from the system clipboard.
    fn read_rtf(&self) -> Result<Option<String>, String>;

    /// Read an image from the system clipboard.
    fn read_image(&self) -> Result<Option<Vec<u8>>, String>;

    /// Read files from the system clipboard.
    fn read_files(&self) -> Result<Option<Vec<String>>, String>;

    /// Write text to the system clipboard.
    fn write_text(&self, text: &str) -> Result<(), String>;

    /// Write an image (from a local file path) to the system clipboard.
    fn write_image(&self, path: &Path) -> Result<(), String>;

    /// Write a list of file paths to the system clipboard.
    fn write_files(&self, paths: Vec<String>) -> Result<(), String>;

    /// Clear the system clipboard.
    fn clear(&self) -> Result<(), String>;
}

pub mod monitor;
pub(crate) mod native;

#[cfg(target_os = "linux")]
pub(crate) mod wayland;

#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;
