//! Stage 5: Metadata — extract preview, char count, line count, source app.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Metadata;

impl PipelineStage for Metadata {
    fn name(&self) -> &'static str {
        "metadata"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        if let Some(text) = &item.content_text {
            item.char_count = text.chars().count() as i64;
            item.line_count = text.lines().count() as i64;

            // Preview: first 200 chars, replace newlines with spaces, trim
            let preview = text
                .chars()
                .take(200)
                .collect::<String>()
                .replace('\n', " ")
                .trim()
                .to_string();
            item.preview = Some(preview);

            tracing::debug!(
                stage = self.name(),
                chars = item.char_count,
                lines = item.line_count,
                "metadata generated"
            );
        }

        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metadata() {
        let metadata = Metadata;
        let mut item = ClipItem::from_text("hello\nworld\n".repeat(50));

        let result = metadata.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));

        assert_eq!(item.char_count, 600);
        assert_eq!(item.line_count, 100);

        let preview = item.preview.unwrap();
        assert!(preview.len() <= 200);
        assert!(!preview.contains('\n'));
    }
}
