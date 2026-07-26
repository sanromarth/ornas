# ORNAS V2 Threading Model

This document outlines the complete concurrency architecture, thread ownership, and synchronization primitives used in ORNAS V2.

## 1. Threads

### 1.1 Main Thread (Tauri UI/Event Loop)
- **Role**: Manages the application lifecycle, GUI window rendering, and system tray.
- **Ownership**: Owns the Tauri `AppHandle`.
- **Behavior**: Must never be blocked by heavy computation or synchronous I/O.

### 1.2 Clipboard Monitor Thread
- **Role**: Polls or listens to OS clipboard APIs (e.g., Wayland GTK polling, X11/Mac/Win event hooks).
- **Ownership**: Owns the OS clipboard context.
- **Behavior**: Blocks waiting for OS events. When an event fires, it reads the raw bytes, packages them into a `ClipItem`, and pushes it into the `pipeline_tx` channel.

### 1.3 Pipeline Runner Thread
- **Role**: Executes the sequential fast-path pipeline (Normalizer -> ... -> Persister -> Dispatcher).
- **Ownership**: Owns the `Receiver` half of the clipboard `mpsc` channel. Mutates the `ClipItem` sequentially.
- **Behavior**: Ensures deterministic, FIFO ordering of all incoming clips. Must execute in under 20ms.

### 1.4 Background Worker Thread (JobQueue)
- **Role**: Executes heavy, deferred tasks (e.g., Image I/O).
- **Ownership**: Owns the `Receiver` half of the `BackgroundJob` `mpsc` channel.
- **Behavior**: Blocks on the channel waiting for jobs. Operates entirely outside the critical path.

---

## 2. Channels

### 2.1 Clipboard Event Channel (`std::sync::mpsc::channel<ClipItem>`)
- **Sender**: Clipboard Monitor Thread.
- **Receiver**: Pipeline Runner Thread.
- **Flow**: Raw data flows from OS detection into the fast-path processing system.

### 2.2 Job Queue Channel (`std::sync::mpsc::channel<BackgroundJob>`)
- **Sender**: `Dispatcher` stage (running on the Pipeline Runner Thread).
- **Receiver**: Background Worker Thread.
- **Flow**: Deferred heavy payloads (like `Vec<u8>`) move from the fast path to the background execution context.

---

## 3. Synchronization Primitives

### 3.1 SQLite Database (`std::sync::Mutex<rusqlite::Connection>`)
- **Location**: Wrapped inside the `Database` struct in `AppState`.
- **Usage**: Shared across the Pipeline Runner (for `INSERT`), the Background Worker (for `UPDATE`), and Tauri command threads (for queries).
- **Safety**: SQLite is configured in WAL (Write-Ahead Logging) mode, preventing read/write contention. The `Mutex` ensures safe access to the connection handle across threads.

### 3.2 State Injection (`std::sync::Arc`)
- All global services, repositories, and the `JobQueue` are wrapped in `Arc`s and stored in Tauri's `AppState`.
- Provides lock-free, shared read-only access to infrastructure dependencies across all threads.

---

## 4. Shutdown Behavior
1. The user quits the application via the UI or system tray.
2. The Tauri Main Thread triggers the shutdown sequence.
3. The `AppState` is dropped.
4. The `Sender` halves of the `mpsc` channels (`pipeline_tx` and `job_queue_tx`) are dropped.
5. The `Receiver`s in the Pipeline Runner and Background Worker threads return an error on `recv()`.
6. The loops `break`, safely tearing down the background threads without panicking or corrupting data.
