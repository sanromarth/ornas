# ORNAS Job Queue Design

## 1. Queue Lifecycle
The `JobQueue` is initialized during application startup in `state.rs`. It creates a standard unbounded `std::sync::mpsc` channel and immediately spawns a background worker thread. The `JobQueue` struct holds the `Sender` half of the channel, which is then wrapped in an `Arc` and injected into the `Dispatcher` pipeline stage. The worker thread owns the `Receiver` half of the channel.

## 2. Enqueue Flow
When the pipeline processes a clip that requires deferred heavy operations (e.g., an image), the `Dispatcher` constructs a `BackgroundJob` enum variant (like `ImageJob`). It then calls `job_queue.enqueue(job)`. The method sends the job through the `mpsc` channel. If the channel is disconnected (which only happens during shutdown), it logs a warning and gracefully drops the job.

## 3. Worker Execution
The worker thread runs a continuous `loop { match rx.recv() { ... } }`. It blocks efficiently until a job is available.
When a job is received, it matches on the `BackgroundJob` variant:
- For an `ImageJob`, it delegates to the `process_image_job` function.
- The worker executes synchronously for that job. Since there is currently one worker thread, jobs are processed in strict FIFO order.

## 4. Ownership Model
The `JobQueue` strictly enforces ownership transfer to avoid memory copies on the critical path:
- Large allocations (like `image_bytes: Vec<u8>`) are extracted from the `ClipItem` using `std::mem::take` inside the `Dispatcher`.
- Ownership of the `Vec<u8>` is moved into the `ImageJob` struct.
- The `ImageJob` struct is moved across the thread boundary into the `mpsc` channel.
- The worker thread takes ownership of the `ImageJob`, consumes the `Vec<u8>` by passing it to the `ImageStore`, and the memory is safely dropped off the critical path.

## 5. Failure Handling
The worker thread isolates failures:
- If a background job fails (e.g., disk full when saving an image), the error is caught and logged by the worker thread.
- The worker loop **does not panic** and **does not break**. It simply logs the error and proceeds to the next job in the channel.
- This ensures that a single failed thumbnail generation does not crash the application or halt the background processing pipeline.

## 6. Graceful Shutdown
The application relies on Tauri's shutdown lifecycle. Currently, the `std::sync::mpsc::channel` does not have a formal graceful teardown sequence. When the application exits, the `JobQueue` instance is dropped, closing the `Sender`. The worker thread's `rx.recv()` will then return an error, causing the worker thread to break its loop and exit cleanly.

## 7. Future Extensibility
The `JobQueue` is designed to be highly extensible:
- New tasks can be added simply by defining a new variant in the `BackgroundJob` enum (e.g., `BackgroundJob::Ocr(OcrJob)`).
- The worker thread's `match` statement handles the routing.
- The architecture can easily be upgraded from a single worker thread to a thread pool (e.g., using `crossbeam-channel` or `rayon`) if CPU-bound tasks like local AI processing are introduced, without affecting the `Dispatcher` or the fast path.
