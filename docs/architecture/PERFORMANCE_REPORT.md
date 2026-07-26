# ORNAS V2 Performance Report

## 1. Overview
This report evaluates the performance improvements achieved by the ORNAS V2 decoupled pipeline architecture compared to the V1 synchronous model.

*Note: Specific millisecond timing measurements are based on manual log observations during development. Automated benchmarking tools have not yet been implemented for statistical distributions (p50/p95/p99).*

## 2. Comparison Metrics

| Metric | Old Architecture (V1) | New Architecture (V2) | Improvement/Impact |
| :--- | :--- | :--- | :--- |
| **Pipeline Latency (Text)** | ~2-5ms | ~2-5ms | Unchanged (already optimal) |
| **Pipeline Latency (Image)** | ~50-150ms | **<10ms** | **~10x faster** critical path |
| **Persistence Latency (DB Insert)** | ~1-2ms | ~1-2ms | Unchanged |
| **Image Disk I/O** | Synchronous | Asynchronous | Moved off critical path |
| **Thumbnail Generation** | Synchronous | Asynchronous | Moved off critical path |
| **UI Responsiveness** | Blocked until I/O finished | Instant text/skeleton rendering | Fluid, perception of zero latency |

## 3. Analysis of Metrics

### 3.1 Clipboard Capture Latency
- **V1**: The capture thread was decoupled, but the consumer pipeline was synchronous. Capturing 10 massive images in rapid succession would block the pipeline thread for >1 second.
- **V2**: The pipeline executes memory transformations and a DB insert. It handles 10 image captures in <100ms total, never backing up the OS clipboard monitor.

### 3.2 Image & Thumbnail Latency
- **Measurement Method**: Currently logged via `std::time::Instant` spans in the worker thread.
- **Result**: Saving a multi-megabyte PNG and generating a 256px thumbnail still takes ~50-100ms, but this time is spent entirely on the `JobQueue` thread. The user does not experience this as "lag".

### 3.3 Memory Usage
- **V1**: Large `Vec<u8>` allocations lived across the entire pipeline duration.
- **V2**: The `Vec<u8>` is rapidly extracted from `ClipItem` by the `Dispatcher` and moved to the background thread. Garbage collection (dropping the `Vec<u8>`) happens concurrently.

### 3.4 CPU Usage
- **V2 Impact**: Negligible overhead added by the `mpsc` channel. Spikes in CPU usage during thumbnail generation are isolated to a single background core.

## 4. Pending Benchmarks
To fully validate the architecture at production scale, the following automated benchmarks still need to be implemented:
1. **Saturation Test**: Copying 100 images per second to measure `JobQueue` depth and memory high-water marks.
2. **SQLite Contention**: Profiling `Mutex<rusqlite::Connection>` locking overhead when the fast path performs `INSERT`s concurrently with the background worker performing `UPDATE`s.
3. **Frontend Render Profiling**: Chrome DevTools profiling to ensure the `clip-updated` incremental patch doesn't trigger widespread DOM recalculations.
