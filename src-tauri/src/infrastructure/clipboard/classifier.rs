//! Clipboard Classifier — single source of truth for clipboard content detection.
//!
//! Examines the available clipboard formats and determines exactly one canonical
//! content type. All downstream services consume this classification; no service
//! should duplicate MIME detection logic.
//!
//! Detection priority (richest data wins):
//! 1. Raw image data (screenshots, browser "Copy Image")
//! 2. File references (file manager copies)
//! 3. Plain text (everything else)
//!
//! Platform behavior is abstracted through `clipboard-rs`, which maps:
//! - Linux X11/Wayland: `image/png` → `get_image()`, `text/uri-list` → `get_files()`
//! - Windows: `CF_BITMAP` → `get_image()`, `CF_HDROP` → `get_files()`
//! - macOS: `NSPasteboardTypePNG` → `get_image()`, `NSPasteboardTypeFileURL` → `get_files()`

use clipboard_rs::common::RustImage;
use clipboard_rs::{Clipboard, ClipboardContext};

/// The result of classifying clipboard content.
///
/// Each variant carries exactly the data needed by downstream consumers.
/// The classifier is the *only* component that reads from the clipboard context.
#[derive(Debug)]
pub enum ClipboardContent {
    /// Raw image bytes captured directly from the clipboard.
    /// Source: screenshots, browser "Copy Image", paint tools.
    RawImage {
        /// PNG-encoded image bytes.
        bytes: Vec<u8>,
    },

    /// One or more file references copied from a file manager.
    /// Source: Nautilus, Dolphin, Windows Explorer, macOS Finder.
    FileList {
        /// Absolute filesystem paths.
        paths: Vec<String>,
    },

    /// Plain text content.
    /// Source: text editors, terminals, browser "Copy", code editors.
    Text {
        /// The text content.
        text: String,
    },
}

/// Examines the system clipboard and returns a classified content result.
///
/// Returns `None` if the clipboard is empty or contains no recognizable content.
///
/// The detection order is deliberately chosen to prefer richer representations:
/// 1. Raw image data (highest fidelity for visual content)
/// 2. File references (preserves filesystem context)
/// 3. Plain text (universal fallback)
///
/// This ordering is correct across all platforms because `clipboard-rs` maps
/// platform-specific formats to a unified API:
/// - When copying a screenshot, `get_image()` returns raw PNG bytes.
///   `get_files()` typically fails. Priority 1 captures this correctly.
/// - When copying a file from a file manager, `get_image()` fails (no raw pixels).
///   `get_files()` returns the URI. Priority 2 captures this correctly.
/// - When copying text, both `get_image()` and `get_files()` fail.
///   `get_text()` succeeds. Priority 3 captures this correctly.
pub fn classify(ctx: &ClipboardContext) -> Option<ClipboardContent> {
    // Priority 1: Raw image data
    if let Ok(image) = ctx.get_image() {
        match image.to_png() {
            Ok(buffer) => {
                let bytes = buffer.get_bytes().to_vec();
                if !bytes.is_empty() {
                    tracing::debug!(
                        format = "raw_image",
                        size_bytes = bytes.len(),
                        "Clipboard classified as raw image"
                    );
                    return Some(ClipboardContent::RawImage { bytes });
                }
            }
            Err(e) => {
                tracing::debug!("Image conversion to PNG failed: {e}");
            }
        }
    }

    // Priority 2: File references
    if let Ok(files) = ctx.get_files() {
        if !files.is_empty() {
            tracing::debug!(
                format = "file_list",
                count = files.len(),
                first = %files[0],
                "Clipboard classified as file list"
            );
            return Some(ClipboardContent::FileList { paths: files });
        }
    }

    // Priority 3: Plain text
    if let Ok(text) = ctx.get_text() {
        if !text.trim().is_empty() {
            tracing::debug!(
                format = "text",
                len = text.len(),
                "Clipboard classified as text"
            );
            return Some(ClipboardContent::Text { text });
        }
    }

    tracing::debug!("Clipboard empty or unrecognized format");
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clipboard_content_variants_are_constructible() {
        // Verify enum variants can be constructed (compile-time check)
        let _img = ClipboardContent::RawImage {
            bytes: vec![0x89, 0x50, 0x4e, 0x47],
        };
        let _files = ClipboardContent::FileList {
            paths: vec!["/tmp/test.png".to_string()],
        };
        let _text = ClipboardContent::Text {
            text: "hello".to_string(),
        };
    }
}
