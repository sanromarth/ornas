//! Stage 6: Persister — write clip to SQLite and save images to filesystem.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Persister;

impl PipelineStage for Persister {
    fn name(&self) -> &'static str { "persister" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
