//! Classification maintenance commands.
//!
//! Provides the optional "Reanalyze Clipboard Library" operation
//! that reclassifies auto-detected clips using the current engine.
//! Manual overrides are always respected and never reclassified.

use crate::domain::clip::ClipUpdate;
use crate::domain::traits::ListParams;
use crate::error::AppError;
use crate::infrastructure::pipeline::content_classifier::ContentClassifier;
use crate::infrastructure::pipeline::language_classifier::LanguageClassifier;
use crate::state::AppState;

use crate::domain::classifier::{DetectedContentType, SOURCE_CODE_GATE_THRESHOLD};
use serde::Serialize;
use tauri::State;

/// Progress report emitted during reanalysis.
#[derive(Debug, Clone, Serialize)]
pub struct ReanalysisProgress {
    pub processed: u64,
    pub updated: u64,
    pub skipped: u64,
    pub total: u64,
    pub complete: bool,
}

/// Reanalyze all auto-classified clips using the current classification engine.
///
/// This operation:
/// - Runs in the calling thread (Tauri async command) in batches
/// - Skips clips with `language_source == "manual"` (manual overrides)
/// - Skips encrypted clips
/// - Only updates clips whose classification actually changed
/// - Returns a summary when complete
#[tauri::command]
pub async fn reanalyze_library(state: State<'_, AppState>) -> Result<ReanalysisProgress, AppError> {
    let content_classifier = ContentClassifier::new();
    let language_classifier = LanguageClassifier::new();

    let clip_repo = state.clip_repo.clone();
    let batch_size = 100u32;
    let mut processed = 0u64;
    let mut updated = 0u64;
    let mut skipped = 0u64;
    let mut cursor_id: Option<i64> = None;

    loop {
        // Fetch a batch of clips
        let params = ListParams {
            limit: batch_size,
            cursor_id,
            ..Default::default()
        };
        let clips = clip_repo.list(&params)?;

        if clips.is_empty() {
            break;
        }

        for clip in &clips {
            cursor_id = Some(clip.id);

            // Skip manual overrides
            if clip.language_source == "manual" {
                skipped += 1;
                processed += 1;
                continue;
            }

            // Skip encrypted clips (no text to analyze)
            if clip.is_encrypted {
                skipped += 1;
                processed += 1;
                continue;
            }

            // Skip image-only clips
            let text = match &clip.content_text {
                Some(t) if !t.trim().is_empty() => t,
                _ => {
                    skipped += 1;
                    processed += 1;
                    continue;
                }
            };

            // Reclassify using the current engine
            let classification = content_classifier.classify(text);
            let new_category = classification.content_type.as_category_str().to_string();
            let mut new_language: Option<String> = None;
            let mut new_is_code = false;
            let mut new_confidence = classification.confidence;

            // Stage 2: language detection (only for source code)
            if classification.content_type == DetectedContentType::SourceCode
                && classification.confidence >= SOURCE_CODE_GATE_THRESHOLD
            {
                if let Some(lang) = language_classifier.detect(text) {
                    new_language = Some(lang.language);
                    new_is_code = true;
                    new_confidence = lang.confidence;
                }
            }

            if classification.content_type == DetectedContentType::SourceCode {
                new_is_code = true;
            }

            // Only update if something actually changed
            let category_changed = clip.category != new_category;
            let language_changed = clip.language != new_language;
            let is_code_changed = clip.is_code != new_is_code;

            if category_changed || language_changed || is_code_changed {
                let update = ClipUpdate {
                    category: Some(new_category),
                    language: new_language,
                    language_source: Some("auto".to_string()),
                    is_code: Some(new_is_code),
                    detection_confidence: Some(new_confidence),
                    ..Default::default()
                };
                clip_repo.update(clip.id, &update)?;
                updated += 1;
            }

            processed += 1;
        }

        // If we got fewer than batch_size, we're done
        if (clips.len() as u32) < batch_size {
            break;
        }
    }

    let total = processed;
    tracing::info!(
        processed = total,
        updated,
        skipped,
        "Library reanalysis complete"
    );

    Ok(ReanalysisProgress {
        processed,
        updated,
        skipped,
        total,
        complete: true,
    })
}
