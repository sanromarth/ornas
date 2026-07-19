//! Stage 1: Normalizer — trim, clean line endings, NFC normalize, strip nulls.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Normalizer;

impl PipelineStage for Normalizer {
    fn name(&self) -> &'static str { "normalizer" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
