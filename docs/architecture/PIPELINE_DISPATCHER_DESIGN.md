# ORNAS V2 Pipeline Dispatcher Design

## 1. Why Dispatcher Replaced Notifier
In the V1 architecture, the final pipeline stage was the `Notifier`, which was solely responsible for emitting the `clip-created` event to the frontend. However, as the architecture evolved to push heavy I/O off the critical path, we needed a stage to bridge the fast-path pipeline and the background `JobQueue`. 

The `Notifier` was renamed and expanded into the `Dispatcher` to reflect its dual role: notifying the UI and dispatching asynchronous background jobs. It guarantees that both the UI event and the background job are triggered exactly once, only after the clip has been successfully persisted to the database.

## 2. Separation of Responsibilities
The Dispatcher strictly isolates scheduling from execution:
- **No Heavy Lifting**: The Dispatcher never performs disk I/O, image compression, or complex computations.
- **Routing**: It inspects the `ClipItem` for pending work (e.g., `item.image_bytes.is_some()`) and acts as a router, constructing jobs and passing them to the appropriate queues.

## 3. Event Emission
The first action the Dispatcher takes is emitting the `clip-created` Tauri event. 
- It passes only the lightweight `id` of the newly inserted database row.
- The frontend receives this event and instantly mounts the new clipboard item in the UI. Because the text and metadata were already inserted by the `Persister` stage, the frontend can query the database and render the item skeleton immediately, preserving a sub-20ms perceived latency for the user.

## 4. Job Scheduling
After emitting the UI event, the Dispatcher schedules necessary background work. 
- For example, if `image_bytes` are present, it creates an `ImageJob` containing the clip ID and the raw image data, and enqueues it via `self.job_queue.enqueue()`.
- Because the `enqueue` operation is merely passing a pointer across an `mpsc` channel, it takes microseconds, keeping the pipeline extremely fast.

## 5. Ownership Transfer & Memory Lifecycle
A critical aspect of the Dispatcher is its role in memory management on the fast path:
- Large objects in the `ClipItem`, specifically the `image_bytes` `Vec<u8>`, are consumed using `take()`.
- The Dispatcher moves ownership of this large heap allocation into the `BackgroundJob`.
- By doing this, the `ClipItem` drops its reference to the heavy data, and the memory footprint of the pipeline thread remains stable.
- The allocation is kept alive only inside the channel and is safely deallocated by the background worker thread after the image is saved to disk, completely bypassing the pipeline thread's execution timeline.
