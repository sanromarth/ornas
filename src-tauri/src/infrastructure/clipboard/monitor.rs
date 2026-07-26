//! Clipboard monitor dispatcher — platform-aware clipboard monitoring.
//!
//! Starts the clipboard watcher on a background thread and forwards
//! captured items to the pipeline for processing.
//!
//! On Wayland, uses GTK's native clipboard API instead of `clipboard-rs`,
//! which panics when X11 is unavailable.

use crate::domain::pipeline::ClipItem;
use crate::infrastructure::database::Database;
use crate::infrastructure::image_store::ImageStore;
use crate::infrastructure::pipeline::runner::PipelineRunner;
use crate::services::file_clipboard::FileClipboardService;
use std::sync::{Arc, mpsc};
use std::thread;

/// Returns true if running under a Wayland session.
#[cfg(target_os = "linux")]
fn is_wayland_session() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|s| s == "wayland")
            .unwrap_or(false)
}

/// Starts the clipboard monitor and pipeline consumer on background threads.
///
/// Returns a channel sender that can be used to manually inject items
/// into the pipeline (useful for testing).
///
/// The monitor runs until the application exits.
pub fn start_clipboard_monitor(
    app_handle: tauri::AppHandle,
    pipeline: Arc<PipelineRunner>,
    db: Arc<Database>,
    image_store: Arc<ImageStore>,
) -> mpsc::Sender<ClipItem> {
    let (sender, receiver) = mpsc::channel::<ClipItem>();
    let (file_sender, file_receiver) = mpsc::channel::<Vec<String>>();

    // File clipboard service thread
    let db_clone = Arc::clone(&db);
    let image_store_clone = Arc::clone(&image_store);
    let file_app_handle = app_handle.clone();
    thread::Builder::new()
        .name("file-clipboard-consumer".into())
        .spawn(move || {
            let service = FileClipboardService::new(db_clone, image_store_clone, file_app_handle);
            for paths in file_receiver {
                if let Err(e) = service.process_files(paths) {
                    tracing::error!("Failed to process files from clipboard: {}", e);
                }
            }
        })
        .ok();

    // Pipeline consumer thread
    let pipeline_clone = Arc::clone(&pipeline);
    thread::Builder::new()
        .name("pipeline-consumer".into())
        .spawn(move || {
            tracing::info!("Pipeline consumer thread started");
            for mut item in receiver {
                match pipeline_clone.process(&mut item) {
                    Ok(()) => {
                        tracing::debug!("Pipeline completed for item");
                    }
                    Err(e) => {
                        tracing::error!("Pipeline error: {e}");
                    }
                }
            }
            tracing::info!("Pipeline consumer thread ended");
        })
        .ok();

    // Clipboard watcher thread — platform-aware
    let watcher_sender = sender.clone();
    let watcher_file_sender = file_sender.clone();

    #[cfg(target_os = "linux")]
    {
        if is_wayland_session() {
            // Wayland: use GTK native clipboard API (clipboard-rs panics without X11)
            tracing::info!(
                backend = "GTK Wayland",
                "Starting clipboard watcher for Wayland session"
            );
            thread::Builder::new()
                .name("clipboard-watcher".into())
                .spawn(move || {
                    super::wayland::start_wayland_watcher(
                        app_handle,
                        watcher_sender,
                        watcher_file_sender,
                    );
                })
                .ok();
        } else {
            // X11: use clipboard-rs event-driven watcher
            tracing::info!(
                backend = "clipboard-rs (X11)",
                "Starting clipboard watcher for X11 session"
            );
            start_clipboardrs_watcher(app_handle, watcher_sender, watcher_file_sender);
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        // macOS/Windows: use clipboard-rs
        tracing::info!(
            backend = "clipboard-rs",
            "Starting clipboard watcher"
        );
        start_clipboardrs_watcher(app_handle, watcher_sender, watcher_file_sender);
    }

    sender
}

/// Starts the clipboard-rs event-driven watcher on a background thread.
///
/// Used on X11, macOS, and Windows where clipboard-rs works correctly.
fn start_clipboardrs_watcher(
    app_handle: tauri::AppHandle,
    sender: mpsc::Sender<ClipItem>,
    file_sender: mpsc::Sender<Vec<String>>,
) {
    use clipboard_rs::ClipboardWatcher;

    thread::Builder::new()
        .name("clipboard-watcher".into())
        .spawn(move || {
            match super::native::start_native_watcher(app_handle, sender, file_sender) {
                Ok(mut watcher) => {
                    watcher.start_watch();
                }
                Err(e) => {
                    tracing::error!("Failed to start clipboard watcher: {e}");
                }
            }
        })
        .ok();
}
