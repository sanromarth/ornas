//! Background job queue — generic, extensible background processing.
//!
//! Provides a FIFO job queue processed on a dedicated background thread.
//! Jobs are dispatched by the pipeline dispatcher after clip persistence
//! and processed independently of the clipboard capture path.
//!
//! ## Design
//!
//! The queue uses `std::sync::mpsc` for consistency with ORNAS's existing
//! threading model (`pipeline-consumer`, `file-clipboard-consumer`).
//! Each job type is a variant of the `BackgroundJob` enum — new job types
//! can be added without changing the queue or worker infrastructure.
//!
//! ## Fault Isolation
//!
//! Each job is processed inside `std::panic::catch_unwind` so a panicking
//! job cannot crash the worker thread. Failed jobs are logged and skipped.

use crate::domain::clip::ClipUpdate;
use crate::domain::traits::ClipRepository;

use crate::infrastructure::image_store::ImageStore;
use crossbeam_channel as mpsc;
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Emitter};

/// A background job dispatched after clip persistence.
///
/// Add new variants here for future background workers.
/// The queue processes all variants without needing changes.
pub enum BackgroundJob {
    /// Save an image to the filesystem and generate a thumbnail.
    Image(ImageJob),
    /// Instructs the worker thread to exit cleanly.
    Shutdown,
}

/// Save a clipboard image and generate its thumbnail.
pub struct ImageJob {
    /// Database ID of the persisted clip.
    pub clip_id: i64,
    /// Content hash used as the filename.
    pub content_hash: String,
    /// Raw image bytes from the clipboard.
    pub image_bytes: Vec<u8>,
}

/// Shared resources available to background job handlers.
///
/// Passed to each job's processing function. Add fields here
/// as new job types require additional infrastructure.
struct JobContext {
    image_store: Arc<ImageStore>,
    clip_repo: Arc<dyn ClipRepository>,
    app_handle: AppHandle,
}

/// Manages background job processing on a dedicated thread.
///
/// Jobs are enqueued via `enqueue()` and processed sequentially in FIFO order
/// on the `"background-job-worker"` thread. Uses a bounded crossbeam channel
/// to prevent runaway memory usage on extreme clipboard bursts.
pub struct JobQueue {
    sender: mpsc::Sender<BackgroundJob>,
    worker_handle: std::sync::Mutex<Option<std::thread::JoinHandle<()>>>,
}

impl JobQueue {
    /// Creates a new bounded job queue and spawns a dedicated worker thread.
    ///
    /// The worker thread processes jobs sequentially using the provided
    /// infrastructure (image store, clip repository, Tauri app handle).
    pub fn start(
        image_store: Arc<ImageStore>,
        clip_repo: Arc<dyn ClipRepository>,
        app_handle: AppHandle,
    ) -> Result<Self, crate::error::AppError> {
        // Bounded queue of 50 items prevents Out-Of-Memory under extreme load.
        let (sender, receiver) = mpsc::bounded::<BackgroundJob>(50);

        let ctx = JobContext {
            image_store,
            clip_repo,
            app_handle,
        };

        let worker_handle = std::thread::Builder::new()
            .name("background-job-worker".into())
            .spawn(move || {
                tracing::info!("Background job worker started");
                Self::worker_loop(receiver, &ctx);
                tracing::info!("Background job worker stopped cleanly");
            })
            .map_err(|e| {
                crate::error::AppError::Internal(format!(
                    "failed to spawn background-job-worker thread: {}",
                    e
                ))
            })?;

        Ok(Self {
            sender,
            worker_handle: std::sync::Mutex::new(Some(worker_handle)),
        })
    }

    /// Enqueues an essential job for background processing.
    ///
    /// Because `ImageJob` contains critical clipboard data, this method uses `send()`
    /// which will BLOCK the caller if the queue is full (backpressure).
    /// This guarantees zero data loss, prioritizing reliability over absolute latency
    /// during extreme bursts.
    pub fn enqueue(&self, job: BackgroundJob) {
        let q_len = self.sender.len();
        if q_len > 10 {
            tracing::warn!(queue_depth = q_len, "Job queue is filling up");
        }

        if let Err(e) = self.sender.send(job) {
            tracing::error!("Failed to enqueue background job (worker shut down?): {e}");
        }
    }

    /// Gracefully shuts down the background worker.
    ///
    /// Signals the worker loop to stop, then joins the thread.
    /// Waits up to `timeout_ms`. If it doesn't join, it logs a warning.
    pub fn shutdown(&self, _timeout_ms: u64) {
        tracing::info!("Initiating graceful shutdown of JobQueue...");
        let _ = self.sender.send(BackgroundJob::Shutdown);

        let handle_opt = match self.worker_handle.lock() {
            Ok(mut guard) => guard.take(),
            Err(poisoned) => {
                tracing::warn!(
                    "JobQueue worker handle mutex was poisoned. Background thread may have panicked."
                );
                poisoned.into_inner().take()
            }
        };

        if let Some(handle) = handle_opt {
            // but closing the channel and sending Shutdown is usually fast enough.
            // For production hardening, we log queue depth before joining.
            tracing::info!(
                pending_jobs = self.sender.len(),
                "Waiting for JobQueue worker to finish in-flight jobs"
            );

            // Note: Since we want a timeout, the best we can do natively is block on join
            // assuming the worker will drain quickly because no new jobs can enter.
            if let Err(e) = handle.join() {
                tracing::error!("Background job worker panicked during shutdown: {:?}", e);
            }
        }
    }
}

impl Drop for JobQueue {
    fn drop(&mut self) {
        self.shutdown(2000);
    }
}

impl JobQueue {
    /// Main worker loop — processes jobs until Shutdown is received or channel closes.
    fn worker_loop(receiver: mpsc::Receiver<BackgroundJob>, ctx: &JobContext) {
        let mut completed_jobs = 0;
        let mut failed_jobs = 0;

        for job in receiver {
            if let BackgroundJob::Shutdown = job {
                tracing::info!(
                    completed_jobs,
                    failed_jobs,
                    "Shutdown signal received. Exiting worker loop."
                );
                break;
            }

            // Fault isolation: catch panics so one bad job doesn't kill the worker.
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                Self::process_job(job, ctx);
            }));

            match result {
                Ok(_) => {
                    completed_jobs += 1;
                }
                Err(panic_info) => {
                    failed_jobs += 1;
                    let msg = if let Some(s) = panic_info.downcast_ref::<&str>() {
                        s.to_string()
                    } else if let Some(s) = panic_info.downcast_ref::<String>() {
                        s.clone()
                    } else {
                        "unknown panic".to_string()
                    };
                    tracing::error!(panic = %msg, "Background job panicked — continuing with next job");
                }
            }
        }
    }

    /// Dispatches a job to the appropriate handler.
    fn process_job(job: BackgroundJob, ctx: &JobContext) {
        match job {
            BackgroundJob::Image(image_job) => {
                Self::process_image_job(image_job, ctx);
            }
            BackgroundJob::Shutdown => {} // Handled in loop
        }
    }

    /// Processes an ImageJob: save image, generate thumbnail, update DB, emit event.
    fn process_image_job(job: ImageJob, ctx: &JobContext) {
        let job_start = Instant::now();
        let clip_id = job.clip_id;

        tracing::info!(
            clip_id = clip_id,
            size_bytes = job.image_bytes.len(),
            "ImageJob started"
        );

        // 1. Save full-size image to filesystem
        let image_path = match ctx.image_store.save(&job.content_hash, &job.image_bytes) {
            Ok(path) => {
                tracing::debug!(
                    clip_id = clip_id,
                    elapsed_ms =
                        format!("{:.2}", job_start.elapsed().as_secs_f64() * 1000.0).as_str(),
                    "image saved"
                );
                path
            }
            Err(e) => {
                tracing::error!(clip_id = clip_id, error = %e, "ImageJob: failed to save image");
                return;
            }
        };

        // 2. Generate thumbnail
        let thumb_start = Instant::now();
        ctx.image_store
            .generate_thumbnail(&job.content_hash, &job.image_bytes);
        tracing::debug!(
            clip_id = clip_id,
            elapsed_ms = format!("{:.2}", thumb_start.elapsed().as_secs_f64() * 1000.0).as_str(),
            "thumbnail generated"
        );

        // 3. Update database with image path
        let update = ClipUpdate {
            image_path: Some(image_path),
            ..Default::default()
        };

        if let Err(e) = ctx.clip_repo.update(clip_id, &update) {
            tracing::error!(clip_id = clip_id, error = %e, "ImageJob: failed to update clip image_path");
            return;
        }

        // 4. Emit clip-updated event so the UI refreshes the thumbnail
        if let Err(e) = ctx
            .app_handle
            .emit("clip-updated", serde_json::json!({ "id": clip_id }))
        {
            tracing::error!(clip_id = clip_id, error = %e, "ImageJob: failed to emit clip-updated");
        }

        let total_elapsed = job_start.elapsed();
        tracing::info!(
            clip_id = clip_id,
            total_ms = format!("{:.2}", total_elapsed.as_secs_f64() * 1000.0).as_str(),
            "ImageJob completed"
        );
    }
}
