#[cfg(debug_assertions)]
use crate::{
    domain::clip::{ContentType, NewClip},
    error::AppError,
    state::AppState,
};
#[cfg(debug_assertions)]
use std::time::{SystemTime, UNIX_EPOCH};
#[cfg(debug_assertions)]
use tauri::State;

#[cfg(debug_assertions)]
#[tauri::command]
pub fn dev_generate_clips(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
    count: usize,
) -> Result<(), AppError> {
    let repo = &state.clip_repo;

    // Some realistic sample payloads
    let dummy_json = r#"{"status": "success", "data": {"users": [{"id": 1, "role": "admin"}], "pagination": {"page": 1}}}"#;
    let dummy_html = r#"<div class="email-body"><h1>Weekly Sync Notes</h1><p>Please review the Q3 roadmap before Thursday.</p></div>"#;
    let dummy_code = "fn main() {\n    // Initialize database connection\n    let db = Database::connect().unwrap();\n    println!(\"Connected\");\n}";

    let _categories = [
        "plain_text",
        "url",
        "code",
        "json",
        "html",
        "markdown",
        "shell",
        "diff",
    ];

    for i in 0..count {
        let (content, html, rtf, content_type, cat, is_code, lang) = match i % 5 {
            0 => (
                Some(format!(
                    "Meeting Notes 2026-07-{:02}\n- Discussed Q3 goals\n- Marketing budget approved",
                    i + 1
                )),
                None,
                None,
                ContentType::Text,
                "plain_text",
                false,
                None,
            ),
            1 => (
                Some(dummy_html.to_string()),
                Some(dummy_html.to_string()),
                None,
                ContentType::RichText,
                "html",
                false,
                None,
            ),
            2 => (
                Some(dummy_json.to_string()),
                None,
                None,
                ContentType::Text,
                "json",
                true,
                Some("json".to_string()),
            ),
            3 => (
                Some(dummy_code.to_string()),
                None,
                None,
                ContentType::Text,
                "code",
                true,
                Some("rust".to_string()),
            ),
            _ => (
                Some(format!(
                    "https://github.com/sanromarth/ornas/pull/{}",
                    i + 100
                )),
                None,
                None,
                ContentType::Text,
                "url",
                false,
                None,
            ),
        };

        let clip = NewClip {
            content_text: content.clone(),
            content_html: html,
            content_rtf: rtf,
            image_path: None,
            content_type,
            category: cat.to_string(),
            source_app: Some("Dev Generator".to_string()),
            content_hash: format!(
                "synth_hash_{}_{}",
                i,
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ),
            preview: content.map(|c| c.chars().take(100).collect()),
            char_count: 50,
            line_count: 1,
            language: lang,
            is_code,
            detection_confidence: 1.0,
            language_source: "generator".to_string(),
            is_encrypted: false,
            encryption_version: None,
            encrypted_blob: None,
            nonce: None,
            metadata: None,
        };

        let created = repo.create(&clip)?;

        // Randomly favorite or pin some
        if i % 15 == 0 {
            repo.set_favorite(created.id, true)?;
        }
        if i % 25 == 0 {
            repo.set_pinned(created.id, true)?;
        }
    }

    // Invalidate the cache by emitting a global refresh event or just letting the user refresh
    use tauri::Emitter;
    app.emit("clips-updated", serde_json::json!({ "ids": [] }))
        .ok();

    Ok(())
}
