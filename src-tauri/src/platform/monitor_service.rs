use crate::domain::pipeline::ClipItem;
use crate::platform::clipboard::monitor::{ClipboardMonitor, MonitorState};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

/// MonitorService manages the lifecycle of the clipboard watcher.
///
/// It orchestrates the starting and stopping of the platform-specific
/// clipboard monitor (LinuxMonitor, WindowsMonitor, etc.).
pub struct MonitorService {
    monitor: Arc<Mutex<dyn ClipboardMonitor>>,
}

#[allow(dead_code)]
impl MonitorService {
    pub fn new(monitor: Arc<Mutex<dyn ClipboardMonitor>>) -> Self {
        Self { monitor }
    }

    /// Initializes and starts the monitor, routing items to the provided channels.
    pub fn start(
        &self,
        sender: Sender<ClipItem>,
        file_sender: Sender<Vec<String>>,
    ) -> Result<(), String> {
        let mut monitor = self.monitor.lock().map_err(|e| e.to_string())?;
        monitor.start(sender, file_sender)
    }

    /// Stops the monitor.
    pub fn stop(&self) -> Result<(), String> {
        let mut monitor = self.monitor.lock().map_err(|e| e.to_string())?;
        monitor.stop()
    }

    /// Retrieves the current status of the monitor.
    pub fn status(&self) -> MonitorState {
        if let Ok(monitor) = self.monitor.lock() {
            monitor.status()
        } else {
            MonitorState::Error("Failed to acquire lock".into())
        }
    }
}
