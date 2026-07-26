# ORNAS V2 Architecture Refinement

## 1. Overall Architecture
ORNAS V2 implements a decoupled, event-driven architecture designed to minimize latency on the critical clipboard capture path. It achieves this by strictly separating the **fast-path pipeline** (capture and database insertion) from the **background job queue** (heavy I/O, image processing, and enrichment).

The system consists of three main domains:
1. **Frontend (UI)**: A React-based UI that renders progressively. It listens for `clip-created` events for immediate display and `clip-updated` events for progressive enrichment.
2. **Backend Fast Path (Tauri/Rust)**: Monitors the OS clipboard, processes the raw data through an in-memory pipeline, and immediately persists the text/metadata to SQLite.
3. **Backend Background Queue (Tauri/Rust)**: A generic FIFO worker thread that asynchronously handles time-consuming tasks like image I/O, thumbnail generation, and database patching.

## 2. Clipboard Flow
1. **Capture**: The OS clipboard monitor (e.g., `wayland.rs` or `clipboard-rs`) detects a new clip and dispatches it into an `mpsc` channel.
2. **Pipeline Runner**: A dedicated consumer thread picks up the clip and runs it through sequential stages:
   - `Normalizer`: Trims text, fixes line endings.
   - `CodeDetector`: Detects if text is source code.
   - `Hasher`: Computes `xxHash64` of the content.
   - `Dedup`: LRU cache + DB lookup to skip duplicates.
   - `Categorizer`: Identifies links, emails, etc.
   - `Metadata`: Generates text previews and character counts.
   - `Persister`: Inserts the clip row into SQLite. **No heavy I/O happens here.**
   - `Dispatcher`: The final stage. Emits `clip-created` to the UI and schedules any necessary background jobs (e.g., `ImageJob`).
3. **Background Processing**: The `JobQueue` worker thread receives the `ImageJob`, saves the image to disk, generates a thumbnail, updates the database, and emits `clip-updated`.

## 3. Threading Model
The architecture employs three distinct thread groups:
- **Clipboard Monitor Thread**: Blocks on OS clipboard polling/events. Communicates via an unbounded `mpsc` channel.
- **Pipeline Runner Thread**: A single thread that sequentially processes the fast-path pipeline. Ensures deterministic ordering of clips.
- **Background Worker Thread**: A single worker thread (expandable to a pool in the future) that pops jobs off the `JobQueue` channel and executes them.

## 4. Event Model
The system uses an incremental event model to guarantee responsiveness:
- **`clip-created`**: Emitted by the `Dispatcher` immediately after the lightweight DB insert. The UI renders the skeleton/text of the clip instantly.
- **`clip-updated`**: Emitted by the `JobQueue` workers after heavy operations (e.g., image thumbnail generation). The UI patches the existing item in the DOM without re-rendering the entire list.

## 5. Background Processing
The `JobQueue` is a fundamental addition to ORNAS V2. It decouples the deterministic, fast clipboard pipeline from indeterminate file I/O operations. The queue currently handles `ImageJob`s, but is designed generically to support future tasks like OCR, AI tagging, or network synchronization.

## 6. Component Responsibilities
- **Clipboard Monitor**: Listen to OS APIs; send raw bytes to Pipeline.
- **Pipeline Stages**: Apply in-memory transformations. No network or heavy file I/O allowed.
- **Persister**: Execute the exact `INSERT INTO clips` statement as fast as possible.
- **Dispatcher**: Act as the bridge between the fast path, the UI, and the background queue.
- **JobQueue**: Manage the queue lifecycle, spawn the worker thread, and provide an enqueue API.
- **Workers**: Execute isolated units of work (e.g., saving PNG files) and patch the database upon completion.
