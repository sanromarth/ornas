# ORNAS V2 — Wayland Architecture Recommendation

## 1. Recommendation: Keep Polling, but Decouple GTK
The current polling architecture (500ms) should be preserved. However, the exact GTK API implementation must be modified to move `wait_for_image()` off the Tauri main thread.

## 2. Evidence & Justification

### Why keep polling?
Event-driven Wayland APIs (`wlr-data-control`) only work on a fraction of Linux desktops (Sway, Hyprland). GNOME and KDE deliberately reject these protocols. Relying on GTK `owner-change` signals fails reliably when the clipboard manager is running in the background without a focused window. Therefore, polling is the *only* cross-desktop mechanism that guarantees clipboard detection on GNOME and KDE Wayland sessions.

### Why change the thread model?
The blocking analysis (`WAYLAND_BLOCKING_ANALYSIS.md`) proves that `clipboard.wait_for_image()` freezes the Tauri main UI thread. If a user copies a massive RAW image or a 4K screenshot, the ORNAS UI will completely hang for hundreds of milliseconds while the Wayland compositor pipes the data into the GTK buffer.

## 3. Improved Architecture Design

**Target**: Background GTK Context
Instead of using `app_handle.run_on_main_thread()`, the `wayland.rs` implementation should:
1. Spawn a dedicated `std::thread`.
2. Initialize a separate, isolated GTK context inside that thread (if GTK allows multiple contexts, or use a pure Wayland client library like `wayland-client` just for clipboard polling).
3. Alternatively, use a non-blocking asynchronous approach: instead of `wait_for_image()`, use `request_image()` which provides a callback, allowing the UI thread to return immediately while GTK processes the pipe in the background.

## 4. Conclusion
Do NOT replace polling with event-driven architectures. Do NOT rewrite the module to use `wlr-data-control` (as it breaks GNOME).
**Do** refactor `wayland.rs` to use asynchronous GTK requests or a dedicated GTK thread to prevent UI freezing during large payload transfers.
