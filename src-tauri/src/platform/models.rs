use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DisplayServer {
    Wayland,
    X11,
    Win32,
    Cocoa,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformCapabilities {
    pub supports_html: bool,
    pub supports_rtf: bool,
    pub supports_images: bool,
    pub supports_files: bool,
    pub supports_primary_selection: bool,
    pub native_monitoring: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub operating_system: String,
    pub platform_version: String,
    pub display_server: DisplayServer,
    pub desktop_environment: String,
    pub capabilities: PlatformCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticsInfo {
    pub clipboard_monitor_status: String,
    pub database_health: String,
    pub wal_status: String,
    pub storage_engine: String,
    pub clipboard_backend: String,
    pub recovery_status: String,
    pub recent_errors: Vec<String>,
    pub queue_status: String,
}
