//! Stage: Code Detector
//!
//! Uses heuristic scoring to detect if the clip is source code,
//! and determines the programming language.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;

/// Stage that detects code languages using heuristics.
pub struct CodeDetector;

impl CodeDetector {
    pub fn new() -> Self {
        Self
    }
}

impl PipelineStage for CodeDetector {
    fn name(&self) -> &'static str {
        "code_detector"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        // We only process plain text clips
        if item.content_type != "text" {
            return Ok(StageAction::Continue);
        }

        let text = match &item.content_text {
            Some(t) => t,
            None => return Ok(StageAction::Continue),
        };

        // Don't bother with tiny clips
        if text.trim().len() < 10 {
            return Ok(StageAction::Continue);
        }

        let (best_lang, confidence) = detect_language(text);

        if confidence > 0.3 {
            item.language = Some(best_lang.to_string());
            item.is_code = true;
            item.detection_confidence = confidence;
            // Also override category if it's currently plain_text
            if item.category == "plain_text" {
                item.category = "code".to_string();
            }
        }

        Ok(StageAction::Continue)
    }
}

/// Simple heuristic language detector.
/// Returns (language_id, confidence_score)
fn detect_language(text: &str) -> (&'static str, f64) {
    let mut scores = vec![
        ("rust", score_rust(text)),
        ("python", score_python(text)),
        ("javascript", score_javascript(text)),
        ("typescript", score_typescript(text)),
        ("html", score_html(text)),
        ("css", score_css(text)),
        ("json", score_json(text)),
        ("yaml", score_yaml(text)),
        ("markdown", score_markdown(text)),
        ("sql", score_sql(text)),
        ("bash", score_bash(text)),
        ("c", score_c(text)),
        ("cpp", score_cpp(text)),
        ("java", score_java(text)),
        ("go", score_go(text)),
        ("php", score_php(text)),
    ];

    scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    let (best_lang, max_score) = scores[0];

    // Cap score at 1.0
    let confidence = if max_score > 1.0 { 1.0 } else { max_score };

    (best_lang, confidence)
}

// ---------------------------------------------------------
// Language Scoring Heuristics
// ---------------------------------------------------------

fn score_rust(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("fn ") {
        score += 0.3;
    }
    if t.contains("let mut ") {
        score += 0.4;
    }
    if t.contains("pub struct ") || t.contains("pub enum ") {
        score += 0.4;
    }
    if t.contains("impl ") {
        score += 0.3;
    }
    if t.contains("println!(") || t.contains("vec![") {
        score += 0.4;
    }
    if t.contains("Result<") && t.contains("AppError") {
        score += 0.2;
    }
    if t.contains("#[derive(") {
        score += 0.5;
    }
    score
}

fn score_python(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("def ") {
        score += 0.3;
    }
    if t.contains("import ") {
        score += 0.1;
    }
    if t.contains("class ") && t.contains(":") {
        score += 0.2;
    }
    if t.contains("if __name__ == '__main__':") || t.contains("if __name__ == \"__main__\":") {
        score += 0.6;
    }
    if t.contains("self.") {
        score += 0.2;
    }
    if t.contains("print(") {
        score += 0.1;
    }
    score
}

fn score_javascript(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("const ") || t.contains("let ") {
        score += 0.2;
    }
    if t.contains("console.log(") {
        score += 0.3;
    }
    if t.contains("function") || t.contains("=>") {
        score += 0.2;
    }
    if t.contains("document.getElementById") || t.contains("window.") {
        score += 0.4;
    }
    if t.contains("import ") && t.contains(" from ") {
        score += 0.2;
    }
    if t.contains("export const") || t.contains("export default") {
        score += 0.3;
    }
    if t.contains("interface ") || (t.contains("type ") && t.contains("=")) {
        score -= 0.2;
    }
    score
}

fn score_typescript(t: &str) -> f64 {
    let mut score = score_javascript(t);
    if t.contains("interface ") {
        score += 0.4;
    }
    if t.contains("type ") && t.contains(" = ") {
        score += 0.3;
    }
    if t.contains(" as ") {
        score += 0.1;
    }
    if t.contains("<T>") || t.contains("Array<") {
        score += 0.2;
    }
    if t.contains("public ") || t.contains("private ") || t.contains("protected ") {
        score += 0.2;
    }
    score
}

fn score_html(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("<!DOCTYPE html>") || t.contains("<!doctype html>") {
        score += 0.8;
    }
    if t.contains("<html>") || t.contains("</div>") || t.contains("</span>") {
        score += 0.4;
    }
    if t.contains("class=\"") || t.contains("id=\"") {
        score += 0.2;
    }
    if t.contains("<head>") || t.contains("<body>") {
        score += 0.4;
    }
    score
}

fn score_css(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("margin:") || t.contains("padding:") {
        score += 0.2;
    }
    if t.contains("display: flex") || t.contains("display: grid") {
        score += 0.4;
    }
    if t.contains("color: #") || t.contains("background-color:") {
        score += 0.3;
    }
    if t.contains("@media") {
        score += 0.3;
    }
    if t.contains("{") && t.contains("}") && t.contains(";") {
        score += 0.2;
    }
    score
}

fn score_json(t: &str) -> f64 {
    let trimmed = t.trim();
    if ((trimmed.starts_with('{') && trimmed.ends_with('}'))
        || (trimmed.starts_with('[') && trimmed.ends_with(']')))
        && serde_json::from_str::<serde_json::Value>(t).is_ok()
    {
        return 1.0;
    }
    0.0
}

fn score_yaml(t: &str) -> f64 {
    let mut score = 0.0;
    if t.starts_with("---") {
        score += 0.4;
    }
    if t.contains(": ") && !t.contains("{") {
        score += 0.2;
    }
    if t.contains("- ") {
        score += 0.1;
    }
    score
}

fn score_markdown(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("## ") || t.contains("### ") {
        score += 0.3;
    }
    if t.contains("```") {
        score += 0.4;
    }
    if t.contains("**") {
        score += 0.2;
    }
    if t.contains("[") && t.contains("](") && t.contains(")") {
        score += 0.4;
    }
    score
}

fn score_sql(t: &str) -> f64 {
    let mut score = 0.0;
    let upper = t.to_uppercase();
    if upper.contains("SELECT ") && upper.contains(" FROM ") {
        score += 0.5;
    }
    if upper.contains("INSERT INTO ") {
        score += 0.5;
    }
    if upper.contains("UPDATE ") && upper.contains(" SET ") {
        score += 0.5;
    }
    if upper.contains("CREATE TABLE ") {
        score += 0.6;
    }
    if upper.contains("WHERE ") {
        score += 0.2;
    }
    score
}

fn score_bash(t: &str) -> f64 {
    let mut score = 0.0;
    if t.starts_with("#!/bin/bash") || t.starts_with("#!/bin/sh") {
        score += 0.9;
    }
    if t.contains("echo ") {
        score += 0.2;
    }
    if t.contains("if [ ") || t.contains("fi\n") {
        score += 0.4;
    }
    if t.contains("apt-get ") || t.contains("npm ") || t.contains("cargo ") {
        score += 0.3;
    }
    score
}

fn score_c(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("#include <") {
        score += 0.4;
    }
    if t.contains("int main(") {
        score += 0.3;
    }
    if t.contains("printf(") {
        score += 0.3;
    }
    if t.contains("malloc(") {
        score += 0.3;
    }
    if t.contains("std::") || t.contains("cout") {
        score -= 0.5;
    }
    score
}

fn score_cpp(t: &str) -> f64 {
    let mut score = score_c(t);
    if t.contains("std::") {
        score += 0.4;
    }
    if t.contains("cout <<") {
        score += 0.4;
    }
    if t.contains("vector<") {
        score += 0.3;
    }
    if t.contains("public:") || t.contains("private:") {
        score += 0.3;
    }
    score
}

fn score_java(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("public class ") {
        score += 0.4;
    }
    if t.contains("public static void main(String[] args)") {
        score += 0.8;
    }
    if t.contains("System.out.println") {
        score += 0.5;
    }
    if t.contains("import java.") {
        score += 0.4;
    }
    score
}

fn score_go(t: &str) -> f64 {
    let mut score = 0.0;
    if t.contains("package main") || t.contains("package ") {
        score += 0.4;
    }
    if t.contains("func ") {
        score += 0.4;
    }
    if t.contains("fmt.Println") {
        score += 0.4;
    }
    if t.contains("err != nil") {
        score += 0.5;
    }
    score
}

fn score_php(t: &str) -> f64 {
    let mut score = 0.0;
    if t.starts_with("<?php") {
        score += 0.9;
    }
    if t.contains("echo $") {
        score += 0.4;
    }
    if t.contains("public function") {
        score += 0.3;
    }
    if t.contains("=>") && t.contains("$") {
        score += 0.3;
    }
    score
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::pipeline::ClipItem;

    #[test]
    fn test_detect_rust() {
        let text = "fn main() {\n    println!(\"Hello\");\n}";
        let (lang, score) = detect_language(text);
        assert_eq!(lang, "rust");
        assert!(score > 0.6);
    }

    #[test]
    fn test_detect_python() {
        let text = "def hello():\n    print('world')\n\nif __name__ == '__main__':\n    hello()";
        let (lang, score) = detect_language(text);
        assert_eq!(lang, "python");
        assert!(score > 0.6);
    }

    #[test]
    fn test_detect_json() {
        let text = "{\n  \"key\": \"value\",\n  \"num\": 123\n}";
        let (lang, score) = detect_language(text);
        assert_eq!(lang, "json");
        assert_eq!(score, 1.0);
    }

    #[test]
    fn test_stage_processing() {
        let stage = CodeDetector::new();
        let mut item = ClipItem::from_text("fn test() { let mut x = 1; }".into());
        let action = stage.process(&mut item).unwrap();

        assert!(matches!(action, StageAction::Continue));
        assert_eq!(item.language.as_deref(), Some("rust"));
        assert!(item.is_code);
        assert!(item.detection_confidence > 0.3);
    }
}
