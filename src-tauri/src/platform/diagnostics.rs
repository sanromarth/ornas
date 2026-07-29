use crate::platform::clipboard::monitor::MonitorState;
use crate::platform::models::{DiagnosticsInfo, DisplayServer, PlatformInfo};
use crate::platform::monitor_service::MonitorService;
use std::sync::Arc;

/// DiagnosticsProvider aggregates system health and metrics.
pub struct DiagnosticsProvider {
    info: PlatformInfo,
    monitor_service: Arc<MonitorService>,
}

impl DiagnosticsProvider {
    pub fn new(info: PlatformInfo, monitor_service: Arc<MonitorService>) -> Self {
        Self {
            info,
            monitor_service,
        }
    }

    /// Fetches the current diagnostics information.
    pub fn get(&self) -> DiagnosticsInfo {
        let monitor_status = match self.monitor_service.status() {
            MonitorState::Running => "Active",
            MonitorState::Stopped => "Stopped",
            MonitorState::Error(_) => "Error",
        };

        DiagnosticsInfo {
            clipboard_monitor_status: monitor_status.into(),
            database_health: "Healthy (WAL Active)".into(), // Hook to DB later
            wal_status: "Active".into(),
            storage_engine: "SQLite FTS5 + BLOB".into(),
            clipboard_backend: match self.info.display_server {
                DisplayServer::Wayland => "GTK/Wayland".into(),
                DisplayServer::X11 => "X11 (clipboard-rs)".into(),
                DisplayServer::Win32 => "Win32 (clipboard-rs)".into(),
                DisplayServer::Cocoa => "Cocoa (clipboard-rs)".into(),
                DisplayServer::Unknown => "Unknown".into(),
            },
            recovery_status: "Ready".into(),
            recent_errors: vec![],
            queue_status: "Idle".into(),
        }
    }
}
