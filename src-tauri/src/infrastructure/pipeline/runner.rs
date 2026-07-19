//! Pipeline runner — executes stages sequentially on a ClipItem.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

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
    pub fn process(&self, item: &mut ClipItem) -> Result<(), AppError> {
        for stage in &self.stages {
            match stage.process(item)? {
                StageAction::Continue => {}
                StageAction::Skip { reason } => {
                    tracing::debug!(stage = stage.name(), reason, "pipeline skipped");
                    return Ok(());
                }
            }
        }
        Ok(())
    }
}
