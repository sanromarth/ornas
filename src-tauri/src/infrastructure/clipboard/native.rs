//! Native clipboard monitor using `clipboard-rs`.
//!
//! Implements the `ClipboardWatcherContext` callback to receive
//! clipboard change notifications and forward them through a channel.

use crate::domain::pipeline::ClipItem;
use clipboard_rs::common::RustImage;
use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext,
};
use std::sync::mpsc::Sender;

/// Handler that receives clipboard change callbacks from `clipboard-rs`.
///
/// On each change, reads the clipboard content and sends a `ClipItem`
/// through the provided channel for pipeline processing.
pub struct NativeClipboardHandler {
    sender: Sender<ClipItem>,
}

impl NativeClipboardHandler {
    /// Creates a new handler that sends clipboard items to the given channel.
    pub fn new(sender: Sender<ClipItem>) -> Self {
        Self { sender }
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

        // Try reading text first
        if let Ok(text) = ctx.get_text() {
            if !text.trim().is_empty() {
                let item = ClipItem::from_text(text);
                if let Err(e) = self.sender.send(item) {
                    tracing::error!("Failed to send clipboard item to pipeline: {e}");
                }
                tracing::debug!("Clipboard text captured");
                return;
            }
        }

        // Try reading image
        if let Ok(image) = ctx.get_image() {
            match image.to_png() {
                Ok(buffer) => {
                    let bytes = buffer.get_bytes().to_vec();
                    let item = ClipItem::from_image(bytes);
                    if let Err(e) = self.sender.send(item) {
                        tracing::error!("Failed to send clipboard image to pipeline: {e}");
                    }
                    tracing::debug!("Clipboard image captured");
                }
                Err(e) => {
                    tracing::warn!("Failed to convert image to PNG: {e}");
                }
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
) -> Result<ClipboardWatcherContext<NativeClipboardHandler>, crate::error::AppError> {
    let handler = NativeClipboardHandler::new(sender);
    let mut watcher = ClipboardWatcherContext::new().map_err(|e| {
        crate::error::AppError::Clipboard(format!("Failed to create clipboard watcher: {e}"))
    })?;

    watcher.add_handler(handler);
    tracing::info!("Native clipboard watcher initialized");

    Ok(watcher)
}
