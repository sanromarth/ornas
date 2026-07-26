# ORNAS V2 — Wayland Blocking Analysis

## 1. Objective
Determine whether the synchronous GTK clipboard APIs used in ORNAS V2 block the main UI thread and assess the worst-case latency scenarios under Wayland.

## 2. API Analysis

### 2.1 `wait_for_targets()`
- **Thread**: Executed on the Tauri Main Thread via `run_on_main_thread`.
- **Behavior**: Requests the list of available MIME types from the clipboard owner. Under Wayland, this requires an IPC round-trip to the compositor, which then queries the source application.
- **Blocking Risk**: High. If the source application (e.g., a heavily loaded web browser) hangs while responding to the targets request, the GTK main loop blocks.

### 2.2 `wait_for_text()`
- **Thread**: Main Thread.
- **Behavior**: Requests UTF-8 text from the clipboard owner.
- **Blocking Risk**: Medium to High. Retrieving large blocks of text from another application requires memory mapping or pipe transfers orchestrated by the Wayland compositor.

### 2.3 `wait_for_image()` & `wait_for_contents()`
- **Thread**: Main Thread.
- **Behavior**: Requests raw image data or specific binary formats (e.g., GNOME file URIs).
- **Blocking Risk**: Extremely High. Converting an internal application image buffer to a PNG/BMP format over a Wayland pipe can take hundreds of milliseconds for massive images. Because this occurs inside `run_on_main_thread`, the entire ORNAS UI (including React rendering and event handling) is frozen until the image transfer completes.

## 3. Latency Measurements (Pending Live Benchmarks)

*Note: As per engineering constraints, exact measurements require execution in a live Wayland session (GNOME/KDE) with a heavy payload (e.g., a 4K image copied from GIMP). The following are structural latency points to be measured:*

1. **Average Target Fetch Latency**: Expected `< 2ms`.
2. **Maximum Image Fetch Latency**: Expected `> 150ms` (Worst case: > 1000ms if the source application is swapping).
3. **Number of Blocking Calls**: The current implementation makes at least 2 blocking calls (`wait_for_targets` + `wait_for_text`) every 500ms, regardless of whether the clipboard changed.

## 4. Conclusion
The current implementation introduces significant blocking risk to the Tauri UI thread. The background thread merely offloads the `sleep` timer; the actual IPC blocking happens on the main thread. This violates the architectural principle of maintaining UI responsiveness.
