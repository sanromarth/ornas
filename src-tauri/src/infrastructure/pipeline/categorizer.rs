//! Stage 4: Categorizer — two-stage confidence-based classification.
//!
//! This is the unified classification pipeline stage. It runs:
//! 1. Content Type Classification (Stage 1) — determines WHAT the content is.
//! 2. Language Classification (Stage 2) — determines WHICH language, only
//!    when Stage 1 identifies SourceCode with sufficient confidence.
//!
//! Manual overrides (language_source == "manual") are always respected.

use crate::domain::classifier::*;
use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use crate::infrastructure::pipeline::content_classifier::ContentClassifier;
use crate::infrastructure::pipeline::language_classifier::LanguageClassifier;

pub struct Categorizer {
    content_classifier: ContentClassifier,
    language_classifier: LanguageClassifier,
}

impl Categorizer {
    pub fn new() -> Self {
        Self {
            content_classifier: ContentClassifier::new(),
            language_classifier: LanguageClassifier::new(),
        }
    }
}

impl PipelineStage for Categorizer {
    fn name(&self) -> &'static str {
        "categorizer"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        let text = match &item.content_text {
            Some(t) if !t.trim().is_empty() => t.clone(),
            _ => return Ok(StageAction::Continue),
        };

        // ── Skip reclassification for manual overrides ────────
        if item.language_source == "manual" {
            tracing::debug!(
                stage = self.name(),
                "skipping classification — manual override"
            );
            return Ok(StageAction::Continue);
        }

        // ── Stage 1: Content Type Classification ──────────────
        let classification = self.content_classifier.classify(&text);

        item.category = classification.content_type.as_category_str().to_string();
        item.detection_confidence = classification.confidence;

        tracing::debug!(
            stage = self.name(),
            category = %item.category,
            confidence = format!("{:.2}", classification.confidence).as_str(),
            "content type classified"
        );

        // ── Stage 2: Language Classification (gated) ──────────
        if classification.content_type == DetectedContentType::SourceCode
            && classification.confidence >= SOURCE_CODE_GATE_THRESHOLD
        {
            if let Some(lang) = self.language_classifier.detect(&text) {
                item.language = Some(lang.language.clone());
                item.is_code = true;
                item.detection_confidence = lang.confidence;
                item.language_source = "auto".to_string();

                tracing::debug!(
                    stage = self.name(),
                    language = %lang.language,
                    confidence = format!("{:.2}", lang.confidence).as_str(),
                    "programming language detected"
                );
            }
        }

        // Also set is_code for categories that the content classifier
        // determined are code-adjacent (even if no specific language)
        if classification.content_type == DetectedContentType::SourceCode && !item.is_code {
            item.is_code = true;
        }

        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorizer_url() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text("https://example.com".to_string());
        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.category, "url");
    }

    #[test]
    fn test_categorizer_json() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text(r#"{"key": "value", "num": 42}"#.to_string());
        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.category, "json");
    }

    #[test]
    fn test_categorizer_plain_text() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text("Just a simple note about something.".to_string());
        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.category, "plain_text");
        assert!(!item.is_code);
        assert!(item.language.is_none());
    }

    #[test]
    fn test_categorizer_rust_code() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text(
            "use std::io;\n\n#[derive(Debug)]\npub struct App {\n    name: String,\n}\n\nimpl App {\n    pub fn new() -> Self {\n        Self { name: \"test\".into() }\n    }\n}".to_string()
        );
        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert!(item.is_code);
        assert_eq!(item.language.as_deref(), Some("rust"));
    }

    #[test]
    fn test_categorizer_respects_manual_override() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text("Just some text".to_string());
        item.language = Some("custom_lang".to_string());
        item.language_source = "manual".to_string();
        item.category = "code".to_string();

        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        // Manual override preserved
        assert_eq!(item.language.as_deref(), Some("custom_lang"));
        assert_eq!(item.category, "code");
    }

    #[test]
    fn test_categorizer_meeting_notes_not_sql() {
        let categorizer = Categorizer::new();
        let mut item = ClipItem::from_text(
            "Meeting Notes 2026-07-28\n\
             - Select the items from the backlog\n\
             - Delete old branches after review\n\
             - Update the project status\n\
             - Insert new members into org chart"
                .to_string(),
        );
        let result = categorizer.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_ne!(
            item.language.as_deref(),
            Some("sql"),
            "Meeting notes must NOT be classified as SQL"
        );
    }
}
