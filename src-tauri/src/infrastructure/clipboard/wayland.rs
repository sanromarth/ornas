//! Wayland clipboard watcher using GTK3 native API.
//!
//! On pure Wayland sessions, `clipboard-rs` panics because it requires X11.
//! This module provides an alternative that polls the GTK clipboard at regular
//! intervals, detects changes via content hashing, and dispatches new items
//! through the pipeline channels.

use crate::domain::pipeline::ClipItem;
use std::sync::mpsc::Sender;


/// Polling interval in milliseconds.
const POLL_INTERVAL_MS: u64 = 500;



/// Starts a GTK-based clipboard watcher for Wayland sessions.
///
/// This function blocks the calling thread (polling loop).
/// It should be called from a dedicated background thread.
#[cfg(target_os = "linux")]
pub fn start_wayland_watcher(
    app_handle: tauri::AppHandle,
    sender: Sender<ClipItem>,
    file_sender: Sender<Vec<String>>,
) {
    tracing::info!(
        "Wayland GTK clipboard polling watcher started (interval={}ms)",
        POLL_INTERVAL_MS
    );

    // State for change detection
    let mut last_targets_hash: u64 = 0;
    let mut last_text_hash: u64 = 0;

    loop {
        std::thread::sleep(std::time::Duration::from_millis(POLL_INTERVAL_MS));

        let sender_clone = sender.clone();
        let file_sender_clone = file_sender.clone();
        let prev_targets_hash = last_targets_hash;
        let prev_text_hash = last_text_hash;

        // Channel to receive the content hashes from the main thread
        let (hash_tx, hash_rx) = std::sync::mpsc::channel::<(u64, u64)>();

        let result = app_handle.run_on_main_thread(move || {
            let clipboard = gtk::Clipboard::get(&gtk::gdk::SELECTION_CLIPBOARD);

            // Step 1: Read targets for change detection (lightweight)
            let targets_hash = {
                let mut input = String::new();
                if let Some(targets) = clipboard.wait_for_targets() {
                    for target in &targets {
                        input.push_str(&target.name());
                        input.push('\n');
                    }
                }
                if input.is_empty() { 0 } else { xxhash_rust::xxh64::xxh64(input.as_bytes(), 0) }
            };

            // Step 2: Determine if clipboard changed
            let targets_changed = targets_hash != prev_targets_hash && targets_hash != 0;

            // Step 3: For text-based change detection (same targets, different content)
            let text = clipboard.wait_for_text();
            let text_hash = text.as_ref()
                .map(|t| xxhash_rust::xxh64::xxh64(t.as_bytes(), 0))
                .unwrap_or(0);

            let text_changed = text_hash != prev_text_hash && text_hash != 0;

            // Report hashes back
            let _ = hash_tx.send((targets_hash, text_hash));

            // Only dispatch if something actually changed
            if !targets_changed && !text_changed {
                return;
            }

            tracing::info!(
                targets_changed,
                text_changed,
                "Wayland clipboard change detected"
            );

            // Dispatch based on content priority
            read_and_dispatch(&clipboard, sender_clone, file_sender_clone, text);
        });

        if let Err(e) = result {
            tracing::warn!("Wayland clipboard poll failed: {e}");
            continue;
        }

        // Update state from main thread results
        if let Ok((new_targets_hash, new_text_hash)) = hash_rx.recv() {
            last_targets_hash = new_targets_hash;
            last_text_hash = new_text_hash;
        }
    }
}

/// Reads the current GTK clipboard content and dispatches it to the pipeline.
///
/// Detection priority (richest data wins):
/// 1. Raw image data (screenshots, browser "Copy Image")
/// 2. File URIs (file manager copies)
/// 3. GNOME copied-files fallback
/// 4. Plain text (everything else)
///
/// The `text` parameter is the text already read during fingerprinting,
/// passed through to avoid reading it twice.
#[cfg(target_os = "linux")]
fn read_and_dispatch(
    clipboard: &gtk::Clipboard,
    sender: Sender<ClipItem>,
    file_sender: Sender<Vec<String>>,
    text: Option<gtk::glib::GString>,
) {
    // Priority 1: Image
    // Check targets directly for image MIME types — more reliable than wait_is_image_available()
    let has_image_target = clipboard.wait_for_targets()
        .map(|targets| targets.iter().any(|t| {
            let name = t.name();
            name.starts_with("image/") && name != "image/svg+xml"
        }))
        .unwrap_or(false);

    if has_image_target {
        tracing::debug!("Wayland clipboard: image target detected, requesting image asynchronously...");
        let sender_clone = sender.clone();
        clipboard.request_image(move |_cb, pixbuf| {
            if let Some(pixbuf) = pixbuf {
                match pixbuf.save_to_bufferv("png", &[]) {
                    Ok(bytes) if !bytes.is_empty() => {
                        tracing::info!(
                            size_bytes = bytes.len(),
                            width = pixbuf.width(),
                            height = pixbuf.height(),
                            "Wayland clipboard: image captured"
                        );
                        if let Err(e) = sender_clone.send(ClipItem::from_image(bytes)) {
                            tracing::error!("Failed to send image to pipeline: {e}");
                        }
                    }
                    Ok(_) => tracing::debug!("Wayland clipboard: empty PNG conversion"),
                    Err(e) => tracing::warn!("Wayland clipboard: PNG conversion failed: {e}"),
                }
            } else {
                tracing::debug!("Wayland clipboard: request_image callback returned None");
            }
        });
        return;
    }

    // Priority 2: File URIs
    let uris = clipboard.wait_for_uris();
    if !uris.is_empty() {
        let paths = extract_file_paths_from_uris(&uris);
        if !paths.is_empty() {
            tracing::info!(
                count = paths.len(),
                "Wayland clipboard: file URIs captured"
            );
            if let Err(e) = file_sender.send(paths) {
                tracing::error!("Failed to send files to pipeline: {e}");
            }
            return;
        }
    }

    // Priority 2.5: GNOME copied-files fallback (x-special/gnome-copied-files)
    if let Some(selection_data) = clipboard.wait_for_contents(
        &gtk::gdk::Atom::intern("x-special/gnome-copied-files"),
    ) {
        let data = selection_data.data();
        if let Ok(gnome_text) = std::str::from_utf8(&data) {
            let paths = extract_gnome_copied_file_paths(gnome_text);
            if !paths.is_empty() {
                tracing::info!(
                    count = paths.len(),
                    "Wayland clipboard: gnome-copied-files captured"
                );
                if let Err(e) = file_sender.send(paths) {
                    tracing::error!("Failed to send gnome-copied-files to pipeline: {e}");
                }
                return;
            }
        }
    }

    // Priority 3: Text (reuse the text already read during fingerprinting)
    if let Some(text) = text {
        if !text.trim().is_empty() {
            tracing::debug!(
                len = text.len(),
                "Wayland clipboard: text captured"
            );
            if let Err(e) = sender.send(ClipItem::from_text(text.to_string())) {
                tracing::error!("Failed to send text to pipeline: {e}");
            }
        }
    }
}

/// Extracts absolute file paths from GTK URI list.
#[cfg(target_os = "linux")]
fn extract_file_paths_from_uris(uris: &[gtk::glib::GString]) -> Vec<String> {
    let mut paths = Vec::new();
    for uri in uris {
        let uri_str = uri.to_string();
        if uri_str.starts_with("file://") {
            let raw_path = uri_str.trim_start_matches("file://");
            let decoded = gtk::glib::uri_unescape_string(raw_path, None::<&str>)
                .map(|s| s.to_string())
                .unwrap_or_else(|| raw_path.to_string());
            paths.push(decoded);
        }
    }
    paths
}

/// Extracts file paths from GNOME's `x-special/gnome-copied-files` format.
#[cfg(target_os = "linux")]
fn extract_gnome_copied_file_paths(text: &str) -> Vec<String> {
    let mut paths = Vec::new();
    for line in text.lines() {
        let line = line.trim();
        if line.starts_with("file://") {
            let raw_path = line.trim_start_matches("file://");
            let decoded = gtk::glib::uri_unescape_string(raw_path, None::<&str>)
                .map(|s| s.to_string())
                .unwrap_or_else(|| raw_path.to_string());
            paths.push(decoded);
        }
    }
    paths
}
