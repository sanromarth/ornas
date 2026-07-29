# ORNAS — Wayland Architecture Review

## 1. Objective
Perform a complete audit of the existing Wayland clipboard implementation in ORNAS, analyzing the clipboard flow, GTK integration, polling strategy, ownership model, and interaction with the ORNAS pipeline.

## 2. Current Architecture
The current Wayland implementation (`src/infrastructure/clipboard/wayland.rs`) is an active polling architecture leveraging GTK3 native APIs (`gtk::Clipboard`). It exists because the primary clipboard library (`clipboard-rs`) panics on pure Wayland sessions due to hardcoded X11 dependencies.

## 3. Clipboard Flow & GTK Integration
1. **Initialization**: A dedicated background thread is spawned, running a continuous `loop`.
2. **Polling**: Every 500ms, the thread sleeps and then executes a closure on the main GTK UI thread via `app_handle.run_on_main_thread()`.
3. **Fingerprinting**: 
   - It calls `clipboard.wait_for_targets()`. If the targets have changed, a change is flagged.
   - It calls `clipboard.wait_for_text()`. It hashes the text. If the hash has changed, a change is flagged.
4. **Dispatch**: If a change is detected, `read_and_dispatch` is invoked. It checks for images, file URIs, and GNOME copied files, falling back to text. The extracted data is sent to the `pipeline_tx` channel.

## 4. Polling Strategy & Justification
- **Why Polling?**: Polling is used because Wayland compositors isolate clipboard access. Traditional X11 properties (`XFixesSelectSelectionInput`) do not exist in Wayland. GTK abstracts this via `connect_owner_change`, but GTK's signal handling for owner changes is notoriously unreliable across different Wayland compositors (especially wlroots-based ones). Polling guarantees detection regardless of the compositor's signal implementation.
- **Why 500ms?**: 500ms is a compromise between responsiveness and battery life. Faster polling (e.g., 50ms) would spin the CPU and wake the UI thread excessively. Slower polling (e.g., 2000ms) would result in a noticeable delay between a user hitting `Ctrl+C` and the clip appearing in ORNAS.

## 5. Threading & Synchronization Model
- **Background Thread**: Manages the sleep cycle and state (hashes) to avoid blocking the UI thread during the 500ms wait.
- **Main Thread Execution**: GTK APIs (`wait_for_targets`, `wait_for_text`) must be called from the main thread. The background thread blocks waiting for the `run_on_main_thread` closure to complete, passing hashes back via a one-shot `mpsc` channel (`hash_tx`).
- **Latency Introduction**: Because the polling closure runs on the main thread, it competes with Tauri's UI rendering. If the UI is busy, clipboard detection is delayed. Conversely, if `wait_for_image()` blocks, it freezes the entire ORNAS UI.

## 6. Clipboard Ownership
ORNAS currently acts strictly as a **Clipboard Requestor**. It reads the clipboard but does not take ownership of the selection. This means it does not interfere with the source application's ability to provide data.
