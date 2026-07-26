# ORNAS V2 Event Model

This document specifies how the backend communicates asynchronous state changes to the frontend React application.

## 1. Core Events

### 1.1 `clip-created`
- **Emitted By**: `PipelineDispatcher` (Fast path)
- **Payload**: `{ "id": i64 }`
- **Purpose**: Signals that a new clip has been inserted into the database.
- **Frontend Reaction**: The frontend immediately requests the clip data for `id` and mounts the new item at the top of the virtualized list. This provides the perception of zero-latency clipboard capture.

### 1.2 `clip-updated`
- **Emitted By**: Background `JobQueue` Workers (e.g., `ImageWorker`)
- **Payload**: `{ "id": i64, "fields": { "image_path": "..." } }` (conceptual, implementation may vary based on exact patching logic)
- **Purpose**: Signals that a background job has finished enriching an existing clip.
- **Frontend Reaction**: The frontend queries the specific clip `id` and updates the React state for that single item in-place, without re-rendering the entire list.

## 2. Ordering Guarantees
- The `clip-created` event is guaranteed to fire **before** any `clip-updated` event for a given `id`.
- This is physically enforced by the architecture: the `Dispatcher` emits `clip-created` and then enqueues the background job. The background job takes >0ms to process before emitting `clip-updated`.
- Due to the single Pipeline Runner thread, `clip-created` events are emitted in strict chronological order of OS clipboard actions.

## 3. Failure Behavior
- If the `Dispatcher` fails to emit `clip-created` (e.g., due to IPC failure), the clip is still safely in the database. The user will see it upon next application restart or manual refresh.
- If a Background Worker fails to emit `clip-updated` (e.g., image disk write fails), the `clip-updated` event simply does not fire. The frontend degrades gracefully, displaying the initial clip state (e.g., an empty image skeleton or fallback icon).

## 4. Future Event Expansion
The model easily extends to new background workers:
- **`clip-updated` (OCR)**: An OCR worker can patch `content_text` and emit a `clip-updated` event. The UI will instantly display the extracted text on an image clip.
- **`clip-updated` (AI)**: An AI tagging worker can patch the `category` or `tags` and emit an update.
- **`sync-status-changed`**: Future peer-to-peer syncing workers can emit unique events to update sync indicators without touching the clipboard list.
