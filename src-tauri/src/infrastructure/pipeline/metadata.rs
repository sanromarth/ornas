//! Stage 5: Metadata — extract preview, char count, line count, source app.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Metadata;

impl PipelineStage for Metadata {
    fn name(&self) -> &'static str { "metadata" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
