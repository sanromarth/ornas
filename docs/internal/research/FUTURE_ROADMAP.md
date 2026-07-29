# ORNAS Future Roadmap

## 1. Architectural Extensibility
The new `JobQueue` and `BackgroundJob` architecture is inherently scalable. Future workers can be added without modifying the fast-path pipeline, ensuring the core clipboard capture engine remains under 20ms indefinitely.

## 2. Adding a New Worker
To add a new background capability, developers only need to follow these steps:
1. **Define the Job Payload**: Add a new variant to the `BackgroundJob` enum (e.g., `OcrJob { clip_id: i64, image_path: String }`).
2. **Dispatch the Job**: Modify the `Dispatcher` to enqueue the new job based on specific conditions (e.g., if the clip is an image, enqueue an `ImageJob` *and* an `OcrJob`).
3. **Handle the Job**: Add a `match` arm in the `JobQueue` worker loop to call the specific processor function.
4. **Patch and Emit**: The processor runs, patches the database using `ClipUpdate`, and emits a `clip-updated` Tauri event.

## 3. Planned Workers

### 3.1 MetadataWorker
- **Trigger**: File URIs copied from a file manager.
- **Action**: Stat the files, extract EXIF data, compute file sizes, and detect internal mimetypes.
- **Update**: Patch the `preview` field with file details.

### 3.2 OCRWorker
- **Trigger**: Successful completion of an `ImageJob`.
- **Action**: Run Tesseract or a local machine learning model over the image to extract text.
- **Update**: Patch the `content_text` field so the image becomes instantly searchable via SQLite FTS5.

### 3.3 AIWorker
- **Trigger**: Any text clip longer than 50 words.
- **Action**: Pass the text through a local LLM or API to summarize the content, extract action items, or assign smart tags.
- **Update**: Patch the `category` or a new `tags` relational table.

### 3.4 LanguageWorker
- **Trigger**: Any generic text clip.
- **Action**: Run NLP language detection to determine the human language (English, Spanish) or programming language with high confidence.
- **Update**: Patch the `language` field.

## 4. Evolving the Queue System
Currently, the `JobQueue` is a single FIFO thread. As we add computationally heavy workers like the `AIWorker`, we must evolve the queue:
- **Thread Pools**: Replace the single `std::thread::spawn` with a pool (e.g., `rayon` or `tokio::runtime`).
- **Priority Queues**: `ImageJob` (user-facing UI) should have higher priority than `AIWorker` (background enrichment).
- **Task Dependencies**: An `OcrJob` can only run *after* an `ImageJob` completes. The `ImageWorker` itself should enqueue the `OcrJob` as its final step.
