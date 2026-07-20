//! Stage 4: Categorizer — detect content type via regex chain.

use crate::domain::category::ContentCategory;
use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

pub struct Categorizer;

impl PipelineStage for Categorizer {
    fn name(&self) -> &'static str {
        "categorizer"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        if let Some(text) = &item.content_text {
            let category = ContentCategory::detect(text);
            item.category = category.as_str().to_string();

            tracing::debug!(stage = self.name(), category = %item.category, "content categorized");
        }

        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorizer() {
        let categorizer = Categorizer;
        let mut item = ClipItem::from_text("https://example.com".to_string());

        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.category, "url");
    }
}
