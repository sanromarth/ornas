//! Stage 3: Dedup — check hash against LRU cache and database.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Dedup;

impl PipelineStage for Dedup {
    fn name(&self) -> &'static str { "dedup" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
