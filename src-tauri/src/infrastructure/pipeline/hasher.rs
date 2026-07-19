//! Stage 2: Hasher — compute xxHash64 of normalized content.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Hasher;

impl PipelineStage for Hasher {
    fn name(&self) -> &'static str { "hasher" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
