# ORNAS V2 — Wayland Code Quality Review

## 1. Objective
Review `src/infrastructure/clipboard/wayland.rs` for code quality, safety, and maintainability.

## 2. Findings

### 2.1 Dead Code
- Removed: A dead `test_async_api` function existed but was purged in a prior refactor as it caused GTK compilation errors (missing `connect_owner_change` on some platforms).
- No unused variables or unused imports currently exist.

### 2.2 Duplicated Logic
- The `extract_file_paths_from_uris` and `extract_gnome_copied_file_paths` functions share identical URI unescaping and string parsing logic.
- **Recommendation**: Refactor the shared extraction logic into a single helper function to improve maintainability.

### 2.3 Thread Safety & Ownership
- The background thread safely clones the `mpsc::Sender` handles before moving them into the `run_on_main_thread` closure.
- State (`last_targets_hash`, `last_text_hash`) is properly isolated in the background thread and updated via a one-shot `hash_rx.recv()` channel, preventing data races with the main thread.
- **Rating**: Excellent. Ownership semantics are safe.

### 2.4 Error Handling
- GTK image conversion failures (`pixbuf.save_to_bufferv`) are caught and logged as warnings rather than panicking.
- If `run_on_main_thread` fails (e.g., app shutting down), the thread logs a warning and `continue`s, which is graceful.
- **Recommendation**: Add backoff logic. If `run_on_main_thread` fails 5 times consecutively, the thread should `break` and exit to prevent infinite error logging loops during application teardown.

### 2.5 GTK Lifecycle
- `gtk::Clipboard::get` is called repeatedly inside the loop closure. This is a lightweight singleton getter in GTK, so it does not cause memory leaks.

## 3. Conclusion
The codebase is clean, well-documented, and safe. The primary improvement areas are minor deduplication of URI parsing logic and implementing an error backoff strategy for the polling loop during shutdown.
