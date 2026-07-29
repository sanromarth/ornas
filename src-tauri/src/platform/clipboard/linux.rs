use super::ClipboardBackend;
use crate::platform::models::DisplayServer;
use std::path::Path;
use tauri::AppHandle;

pub struct LinuxBackend {
    display_server: DisplayServer,
    app_handle: AppHandle,
}

impl LinuxBackend {
    pub fn new(display_server: DisplayServer, app_handle: AppHandle) -> Self {
        Self {
            display_server,
            app_handle,
        }
    }
}

impl ClipboardBackend for LinuxBackend {
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
        if self.display_server == DisplayServer::Wayland {
            let (tx, rx) = std::sync::mpsc::channel();
            let path_buf = path.to_path_buf();

            self.app_handle
                .run_on_main_thread(move || {
                    let res = (|| -> Result<(), String> {
                        let clipboard = gtk::Clipboard::get(&gtk::gdk::SELECTION_CLIPBOARD);
                        let pixbuf = gtk::gdk_pixbuf::Pixbuf::from_file(&path_buf)
                            .map_err(|e| format!("Failed to load image for Wayland: {}", e))?;
                        clipboard.set_image(&pixbuf);
                        clipboard.store();
                        Ok(())
                    })();
                    let _ = tx.send(res);
                })
                .map_err(|e| e.to_string())?;

            return rx.recv().unwrap_or(Err("Main thread panicked".to_string()));
        }

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
use crate::platform::clipboard::{native, wayland};
use std::sync::mpsc::Sender;

pub struct LinuxMonitor {
    display_server: DisplayServer,
    app_handle: AppHandle,
    state: MonitorState,
}

impl LinuxMonitor {
    pub fn new(display_server: DisplayServer, app_handle: AppHandle) -> Self {
        Self {
            display_server,
            app_handle,
            state: MonitorState::Stopped,
        }
    }
}

impl ClipboardMonitor for LinuxMonitor {
    fn start(
        &mut self,
        sender: Sender<ClipItem>,
        file_sender: Sender<Vec<String>>,
    ) -> Result<(), String> {
        if self.state == MonitorState::Running {
            return Ok(());
        }

        let app_handle = self.app_handle.clone();

        if self.display_server == DisplayServer::Wayland {
            tracing::info!(
                backend = "GTK Wayland",
                "Starting clipboard watcher for Wayland session"
            );
            std::thread::Builder::new()
                .name("clipboard-watcher-wayland".into())
                .spawn(move || {
                    wayland::start_wayland_watcher(app_handle, sender, file_sender);
                })
                .map_err(|e| e.to_string())?;
        } else {
            tracing::info!(
                backend = "clipboard-rs (X11)",
                "Starting clipboard watcher for X11 session"
            );

            std::thread::Builder::new()
                .name("clipboard-watcher-x11".into())
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
        }

        self.state = MonitorState::Running;
        Ok(())
    }

    fn stop(&mut self) -> Result<(), String> {
        // clipboard-rs watcher currently runs infinitely in a background thread
        // For now, we update the state to stopped.
        self.state = MonitorState::Stopped;
        Ok(())
    }

    fn status(&self) -> MonitorState {
        self.state.clone()
    }
}
