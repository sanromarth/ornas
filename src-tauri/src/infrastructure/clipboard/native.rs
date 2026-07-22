//! Native clipboard monitor using `clipboard-rs`.
//!
//! Implements the `ClipboardWatcherContext` callback to receive
//! clipboard change notifications and forward classified content
//! through channels for pipeline and file processing.

use crate::domain::pipeline::ClipItem;
use crate::infrastructure::clipboard::classifier::{self, ClipboardContent};
use clipboard_rs::{ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext};
use std::sync::mpsc::Sender;

/// Handler that receives clipboard change callbacks from `clipboard-rs`.
///
/// On each change, delegates to the Clipboard Classifier to determine
/// content type, then routes the classified content to the appropriate
/// downstream channel.
pub struct NativeClipboardHandler {
    sender: Sender<ClipItem>,
    file_sender: Sender<Vec<String>>,
}

impl NativeClipboardHandler {
    /// Creates a new handler that sends clipboard items to the given channels.
    pub fn new(sender: Sender<ClipItem>, file_sender: Sender<Vec<String>>) -> Self {
        Self {
            sender,
            file_sender,
        }
    }
}

impl ClipboardHandler for NativeClipboardHandler {
    fn on_clipboard_change(&mut self) {
        let ctx = match ClipboardContext::new() {
            Ok(ctx) => ctx,
            Err(e) => {
                tracing::warn!("Failed to create clipboard context: {e}");
                return;
            }
        };

        // Delegate all detection logic to the Clipboard Classifier.
        // The classifier examines available formats in priority order
        // (raw image → file list → text) and returns a single canonical result.
        let content = match classifier::classify(&ctx) {
            Some(content) => content,
            None => return,
        };

        match content {
            ClipboardContent::RawImage { bytes } => {
                let item = ClipItem::from_image(bytes);
                if let Err(e) = self.sender.send(item) {
                    tracing::error!("Failed to send clipboard image to pipeline: {e}");
                }
                tracing::debug!("Clipboard raw image captured");
            }

            ClipboardContent::FileList { paths } => {
                if let Err(e) = self.file_sender.send(paths) {
                    tracing::error!("Failed to send clipboard files to pipeline: {e}");
                }
                tracing::debug!("Clipboard files captured");
            }

            ClipboardContent::Text { text } => {
                let item = ClipItem::from_text(text);
                if let Err(e) = self.sender.send(item) {
                    tracing::error!("Failed to send clipboard text to pipeline: {e}");
                }
                tracing::debug!("Clipboard text captured");
            }
        }
    }
}

/// Starts the native clipboard watcher.
///
/// Returns a `ClipboardWatcherContext` that the caller must
/// call `start_watch()` on in a background thread.
pub fn start_native_watcher(
    sender: Sender<ClipItem>,
    file_sender: Sender<Vec<String>>,
) -> Result<ClipboardWatcherContext<NativeClipboardHandler>, crate::error::AppError> {
    let handler = NativeClipboardHandler::new(sender, file_sender);
    let mut watcher = ClipboardWatcherContext::new().map_err(|e| {
        crate::error::AppError::Clipboard(format!("Failed to create clipboard watcher: {e}"))
    })?;

    watcher.add_handler(handler);
    tracing::info!("Native clipboard watcher initialized");

    Ok(watcher)
}
