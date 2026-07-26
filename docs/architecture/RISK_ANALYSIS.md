# ORNAS V2 Risk Analysis

## 1. Deadlocks
- **Risk Level: Low**
- **Analysis**: The architecture relies on channels (`mpsc`) rather than `Mutex`es for inter-thread data passing. The only shared lock is `Mutex<rusqlite::Connection>` inside the `Database` struct. Since no thread holds this lock across an `await` point or during a channel `send`/`recv`, deadlocks are mathematically unlikely.
- **Mitigation**: Continue avoiding `RwLock` or nested `Mutex`es.

## 2. Race Conditions (Event Ordering)
- **Risk Level: Low**
- **Analysis**: The `Dispatcher` emits `clip-created` synchronously before enqueueing the background job. The frontend is guaranteed to receive the creation event before the `clip-updated` event.
- **Mitigation**: If the frontend socket drops events, a manual "refresh" button should fetch the true DB state.

## 3. Ownership Safety
- **Risk Level: Low**
- **Analysis**: Rust's borrow checker strictly prevents use-after-free or double-free scenarios. We use `std::mem::take` to explicitly transfer ownership of heap allocations across the `mpsc` boundary.
- **Mitigation**: None required beyond passing `cargo clippy`.

## 4. Panic Recovery
- **Risk Level: Medium**
- **Analysis**: A panic in the `JobQueue` worker thread will terminate the thread, leaving the background queue disconnected. Subsequent `job_queue.enqueue()` calls will silently drop jobs.
- **Mitigation**: Implement `std::panic::catch_unwind` at the top of the worker thread loop, or use a supervisor pattern to respawn the worker thread if it crashes.

## 5. Queue Saturation
- **Risk Level: High**
- **Analysis**: The `std::sync::mpsc::channel` is unbounded. If a malicious script copies 1,000 massive images per second, the Pipeline Runner will process them in <10ms and enqueue 1,000 `ImageJob`s. The worker thread (taking ~50ms per image) will fall behind, causing the queue to grow infinitely and exhaust RAM (OOM).
- **Mitigation**: 
  - Change the `JobQueue` to a `sync_channel` with a bounded capacity (e.g., 50 items).
  - Implement a shedding strategy: if the queue is full, either drop the job (losing the image) or apply backpressure (blocking the pipeline).

## 6. SQLite Contention
- **Risk Level: Medium**
- **Analysis**: The `Pipeline Runner` does an `INSERT`, and the `Background Worker` does an `UPDATE`. While SQLite WAL mode allows concurrent readers and writers, the `rusqlite` connection is wrapped in a standard `Mutex`. Both threads serialize their queries through this Mutex. Under extreme load, this Mutex becomes a bottleneck.
- **Mitigation**: Use an actual connection pool (like `r2d2`) so the background worker doesn't block the fast path.

## 7. Filesystem Failures (Disk Full)
- **Risk Level: Medium**
- **Analysis**: If the user's disk is full, `ImageStore::save()` will return an `io::Error`.
- **Mitigation**: Currently, the worker logs the error and continues. The clip remains in the DB with `image_path = None`. This is graceful degradation, but the user is not explicitly warned in the UI.

## 8. Image Corruption
- **Risk Level: Low**
- **Analysis**: The `ImageWorker` completely writes the PNG before updating the database. If a crash occurs mid-write, the DB simply thinks there is no image.
- **Mitigation**: Write to a `.tmp` file and perform an atomic `rename` to the final path.

## 9. Shutdown Behavior
- **Risk Level: Medium**
- **Analysis**: On application exit, Tauri drops the `AppState`. The `JobQueue` channel sender is dropped. If the worker is currently mid-write on a large image, the OS might kill the thread abruptly, leaving a partially written image on disk.
- **Mitigation**: Implement a `Shutdown` signal in the `BackgroundJob` enum, allowing the worker to flush operations before joining the thread on application exit.
