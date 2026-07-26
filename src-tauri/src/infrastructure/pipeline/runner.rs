//! Pipeline runner — executes stages sequentially on a ClipItem.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use std::time::Instant;

/// Executes pipeline stages sequentially on a clipboard item.
pub struct PipelineRunner {
    stages: Vec<Box<dyn PipelineStage>>,
}

impl PipelineRunner {
    /// Creates a new pipeline runner with the given stages.
    pub fn new(stages: Vec<Box<dyn PipelineStage>>) -> Self {
        Self { stages }
    }

    /// Processes a clip item through all stages.
    ///
    /// Each stage is timed individually. Total pipeline time is logged
    /// at info level for performance monitoring.
    pub fn process(&self, item: &mut ClipItem) -> Result<(), AppError> {
        let pipeline_start = Instant::now();
        tracing::info!("Pipeline started");

        for stage in &self.stages {
            let stage_start = Instant::now();
            match stage.process(item)? {
                StageAction::Continue => {
                    let stage_elapsed = stage_start.elapsed();
                    tracing::info!(
                        stage = stage.name(),
                        elapsed_us = stage_elapsed.as_micros() as u64,
                        elapsed_ms = format!("{:.2}", stage_elapsed.as_secs_f64() * 1000.0).as_str(),
                        "stage completed"
                    );
                }
                StageAction::Skip { reason } => {
                    let stage_elapsed = stage_start.elapsed();
                    tracing::info!(
                        stage = stage.name(),
                        reason,
                        elapsed_us = stage_elapsed.as_micros() as u64,
                        "pipeline skipped"
                    );
                    let total_elapsed = pipeline_start.elapsed();
                    tracing::info!(
                        total_ms = format!("{:.2}", total_elapsed.as_secs_f64() * 1000.0).as_str(),
                        total_us = total_elapsed.as_micros() as u64,
                        "Pipeline ended (skipped)"
                    );
                    return Ok(());
                }
            }
        }

        let total_elapsed = pipeline_start.elapsed();
        tracing::info!(
            total_ms = format!("{:.2}", total_elapsed.as_secs_f64() * 1000.0).as_str(),
            total_us = total_elapsed.as_micros() as u64,
            "Pipeline ended"
        );
        Ok(())
    }
}
