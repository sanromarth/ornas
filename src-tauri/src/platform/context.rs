use super::clipboard::ClipboardBackend;
use super::diagnostics::DiagnosticsProvider;
use super::models::{DiagnosticsInfo, DisplayServer, PlatformCapabilities, PlatformInfo};
use super::monitor_service::MonitorService;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

/// The PlatformContext is the single source of truth for platform-specific behavior.
/// Business logic should interact with this context instead of checking the OS directly.
#[derive(Clone)]
#[allow(dead_code)]
pub struct PlatformContext {
    info: PlatformInfo,
    clipboard: Arc<dyn ClipboardBackend>,
    monitor_service: Arc<MonitorService>,
    diagnostics_provider: Arc<DiagnosticsProvider>,
    app_handle: AppHandle,
}

#[allow(dead_code)]
impl PlatformContext {
    pub fn new(app_handle: AppHandle) -> Self {
        let display_server = detect_display_server();
        let capabilities = detect_capabilities(&display_server);

        let info = PlatformInfo {
            operating_system: std::env::consts::OS.to_string(),
            platform_version: std::env::consts::ARCH.to_string(), // fallback versioning
            display_server: display_server.clone(),
            desktop_environment: std::env::var("XDG_CURRENT_DESKTOP")
                .unwrap_or_else(|_| "Unknown".to_string()),
            capabilities: capabilities.clone(),
        };

        #[cfg(target_os = "linux")]
        let clipboard = Arc::new(super::clipboard::linux::LinuxBackend::new(
            display_server.clone(),
            app_handle.clone(),
        ));
        #[cfg(target_os = "linux")]
        let clipboard_monitor = Arc::new(Mutex::new(super::clipboard::linux::LinuxMonitor::new(
            display_server.clone(),
            app_handle.clone(),
        )));

        #[cfg(target_os = "windows")]
        let clipboard = Arc::new(super::clipboard::windows::WindowsBackend::new());
        #[cfg(target_os = "windows")]
        let clipboard_monitor = Arc::new(Mutex::new(
            super::clipboard::windows::WindowsMonitor::new(app_handle.clone()),
        ));

        #[cfg(target_os = "macos")]
        let clipboard = Arc::new(super::clipboard::macos::MacOSBackend::new());
        #[cfg(target_os = "macos")]
        let clipboard_monitor = Arc::new(Mutex::new(super::clipboard::macos::MacOSMonitor::new(
            app_handle.clone(),
        )));

        let monitor_service = Arc::new(MonitorService::new(clipboard_monitor));
        let diagnostics_provider = Arc::new(DiagnosticsProvider::new(
            info.clone(),
            monitor_service.clone(),
        ));

        Self {
            info,
            clipboard,
            monitor_service,
            diagnostics_provider,
            app_handle,
        }
    }

    pub fn info(&self) -> &PlatformInfo {
        &self.info
    }

    pub fn capabilities(&self) -> &PlatformCapabilities {
        &self.info.capabilities
    }

    pub fn clipboard(&self) -> Arc<dyn ClipboardBackend> {
        self.clipboard.clone()
    }

    pub fn monitor(&self) -> Arc<MonitorService> {
        self.monitor_service.clone()
    }

    pub fn diagnostics(&self) -> DiagnosticsInfo {
        self.diagnostics_provider.get()
    }
}

fn detect_display_server() -> DisplayServer {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WAYLAND_DISPLAY").is_ok()
            || std::env::var("XDG_SESSION_TYPE").unwrap_or_default() == "wayland"
        {
            return DisplayServer::Wayland;
        }
        return DisplayServer::X11;
    }

    #[cfg(target_os = "windows")]
    {
        return DisplayServer::Win32;
    }

    #[cfg(target_os = "macos")]
    {
        return DisplayServer::Cocoa;
    }

    #[allow(unreachable_code)]
    DisplayServer::Unknown
}

fn detect_capabilities(server: &DisplayServer) -> PlatformCapabilities {
    match server {
        DisplayServer::Wayland => PlatformCapabilities {
            supports_html: true,
            supports_rtf: false, // GTK doesn't easily support RTF natively without complex marshaling
            supports_images: true,
            supports_files: true,
            supports_primary_selection: true,
            native_monitoring: true,
        },
        DisplayServer::X11 => PlatformCapabilities {
            supports_html: true,
            supports_rtf: true,
            supports_images: true,
            supports_files: true,
            supports_primary_selection: true,
            native_monitoring: true,
        },
        DisplayServer::Win32 => PlatformCapabilities {
            supports_html: true,
            supports_rtf: true,
            supports_images: true,
            supports_files: true,
            supports_primary_selection: false,
            native_monitoring: true,
        },
        DisplayServer::Cocoa => PlatformCapabilities {
            supports_html: true,
            supports_rtf: true,
            supports_images: true,
            supports_files: true,
            supports_primary_selection: false,
            native_monitoring: true,
        },
        DisplayServer::Unknown => PlatformCapabilities {
            supports_html: false,
            supports_rtf: false,
            supports_images: false,
            supports_files: false,
            supports_primary_selection: false,
            native_monitoring: false,
        },
    }
}
