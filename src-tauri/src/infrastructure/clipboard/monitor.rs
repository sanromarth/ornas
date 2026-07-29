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
use crate::platform::context::PlatformContext;
use crate::services::file_clipboard::FileClipboardService;
use std::sync::{Arc, mpsc};
use std::thread;

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
    platform: Arc<PlatformContext>,
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

    // Start the platform-specific clipboard watcher via MonitorService
    let watcher_sender = sender.clone();
    let watcher_file_sender = file_sender.clone();

    if let Err(e) = platform
        .monitor()
        .start(watcher_sender, watcher_file_sender)
    {
        tracing::error!("Failed to start clipboard monitor via PlatformContext: {e}");
    }

    sender
}
