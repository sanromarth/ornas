//! Clipboard monitor dispatcher — platform-aware clipboard monitoring.
//!
//! Starts the clipboard watcher on a background thread and forwards
//! captured items to the pipeline for processing.

use crate::domain::pipeline::ClipItem;
use crate::infrastructure::pipeline::runner::PipelineRunner;
use clipboard_rs::ClipboardWatcher;
use std::sync::{Arc, mpsc};
use std::thread;

/// Starts the clipboard monitor and pipeline consumer on background threads.
///
/// Returns a channel sender that can be used to manually inject items
/// into the pipeline (useful for testing).
///
/// The monitor runs until the application exits.
pub fn start_clipboard_monitor(pipeline: Arc<PipelineRunner>) -> mpsc::Sender<ClipItem> {
    let (sender, receiver) = mpsc::channel::<ClipItem>();

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

    // Native clipboard watcher thread
    let watcher_sender = sender.clone();
    thread::Builder::new()
        .name("clipboard-watcher".into())
        .spawn(move || {
            tracing::info!("Clipboard watcher thread started");
            match super::native::start_native_watcher(watcher_sender) {
                Ok(mut watcher) => {
                    watcher.start_watch();
                }
                Err(e) => {
                    tracing::error!("Failed to start clipboard watcher: {e}");
                }
            }
        })
        .ok();

    sender
}
