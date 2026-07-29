use crate::domain::pipeline::ClipItem;
use std::sync::mpsc::Sender;

/// The state of the clipboard monitor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MonitorState {
    Stopped,
    Running,
    Error(String),
}

/// Abstract trait for native clipboard watchers.
#[allow(dead_code)]
pub trait ClipboardMonitor: Send + Sync {
    /// Start the clipboard watcher.
    ///
    /// Items captured will be sent to `sender`. File paths captured will be sent to `file_sender`.
    fn start(
        &mut self,
        sender: Sender<ClipItem>,
        file_sender: Sender<Vec<String>>,
    ) -> Result<(), String>;

    /// Stop the clipboard watcher.
    fn stop(&mut self) -> Result<(), String>;

    /// Get the current status of the watcher.
    fn status(&self) -> MonitorState;
}
