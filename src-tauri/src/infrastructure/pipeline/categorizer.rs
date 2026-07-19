//! Stage 4: Categorizer — detect content type via regex chain.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Categorizer;

impl PipelineStage for Categorizer {
    fn name(&self) -> &'static str { "categorizer" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
