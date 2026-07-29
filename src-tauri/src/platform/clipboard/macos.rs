use super::ClipboardBackend;
use std::path::Path;

pub struct MacOSBackend;

impl MacOSBackend {
    pub fn new() -> Self {
        Self
    }
}

impl ClipboardBackend for MacOSBackend {
    fn read_text(&self) -> Result<Option<String>, String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        match ctx.get_text() {
            Ok(text) => Ok(Some(text)),
            Err(_) => Ok(None),
        }
    }

    fn read_html(&self) -> Result<Option<String>, String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        match ctx.get_html() {
            Ok(html) => Ok(Some(html)),
            Err(_) => Ok(None),
        }
    }

    fn read_rtf(&self) -> Result<Option<String>, String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        match ctx.get_rich_text() {
            Ok(rtf) => Ok(Some(rtf)),
            Err(_) => Ok(None),
        }
    }

    fn read_image(&self) -> Result<Option<Vec<u8>>, String> {
        use clipboard_rs::{Clipboard, ClipboardContext, common::RustImage};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        match ctx.get_image() {
            Ok(img) => {
                let img_bytes = img.to_png().map_err(|e| e.to_string())?;
                Ok(Some(img_bytes.get_bytes().to_vec()))
            }
            Err(_) => Ok(None),
        }
    }

    fn read_files(&self) -> Result<Option<Vec<String>>, String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        match ctx.get_files() {
            Ok(files) => Ok(Some(files)),
            Err(_) => Ok(None),
        }
    }

    fn write_text(&self, text: &str) -> Result<(), String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        ctx.set_text(text.to_string()).map_err(|e| e.to_string())
    }

    fn write_image(&self, path: &Path) -> Result<(), String> {
        use clipboard_rs::{Clipboard, ClipboardContext, common::RustImage};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        let img = RustImage::from_path(path.to_string_lossy().as_ref())
            .map_err(|e| format!("Failed to load image: {}", e))?;

        ctx.set_image(img)
            .map_err(|e| format!("Failed to set image on clipboard: {}", e))
    }

    fn write_files(&self, paths: Vec<String>) -> Result<(), String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        ctx.set_files(paths).map_err(|e| e.to_string())
    }

    fn clear(&self) -> Result<(), String> {
        use clipboard_rs::{Clipboard, ClipboardContext};
        let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
        ctx.clear().map_err(|e| e.to_string())
    }
}
use crate::domain::pipeline::ClipItem;
use crate::platform::clipboard::monitor::{ClipboardMonitor, MonitorState};
use crate::platform::clipboard::native;
use std::sync::mpsc::Sender;
use tauri::AppHandle;

pub struct MacOSMonitor {
    app_handle: AppHandle,
    state: MonitorState,
}

impl MacOSMonitor {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            state: MonitorState::Stopped,
        }
    }
}

impl ClipboardMonitor for MacOSMonitor {
    fn start(
        &mut self,
        sender: Sender<ClipItem>,
        file_sender: Sender<Vec<String>>,
    ) -> Result<(), String> {
        if self.state == MonitorState::Running {
            return Ok(());
        }

        tracing::info!(
            backend = "clipboard-rs",
            "Starting clipboard watcher for macOS"
        );

        let app_handle = self.app_handle.clone();
        std::thread::Builder::new()
            .name("clipboard-watcher-macos".into())
            .spawn(move || {
                use clipboard_rs::ClipboardWatcher;
                match native::start_native_watcher(app_handle, sender, file_sender) {
                    Ok(mut watcher) => {
                        watcher.start_watch();
                    }
                    Err(e) => {
                        tracing::error!("Failed to start clipboard watcher: {e}");
                    }
                }
            })
            .map_err(|e| e.to_string())?;

        self.state = MonitorState::Running;
        Ok(())
    }

    fn stop(&mut self) -> Result<(), String> {
        self.state = MonitorState::Stopped;
        Ok(())
    }

    fn status(&self) -> MonitorState {
        self.state.clone()
    }
}
