//! Stage 7: Notifier — emit Tauri events to update the frontend.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Notifier;

impl PipelineStage for Notifier {
    fn name(&self) -> &'static str { "notifier" }
    fn process(&self, _item: &mut ClipItem) -> Result<StageAction, AppError> {
        Ok(StageAction::Continue)
    }
}
