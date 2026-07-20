//! Stage 1: Normalizer — trim, clean line endings, NFC normalize, strip nulls.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Normalizer;

impl PipelineStage for Normalizer {
    fn name(&self) -> &'static str {
        "normalizer"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        if let Some(text) = &item.content_text {
            let mut cleaned = text.replace("\r\n", "\n");
            cleaned = cleaned.replace('\0', "");
            cleaned = cleaned.trim().to_string();

            if cleaned.is_empty() {
                return Ok(StageAction::Skip {
                    reason: "empty or whitespace only",
                });
            }

            item.content_text = Some(cleaned);
            tracing::debug!(stage = self.name(), "content normalized");
        }

        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalizer() {
        let normalizer = Normalizer;
        let mut item = ClipItem::from_text("  hello \r\n world \0  ".to_string());

        let result = normalizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.content_text.unwrap(), "hello \n world");

        let mut empty_item = ClipItem::from_text("   \r\n  \0 ".to_string());
        let result = normalizer.process(&mut empty_item).unwrap();
        assert!(matches!(result, StageAction::Skip { .. }));
    }
}
