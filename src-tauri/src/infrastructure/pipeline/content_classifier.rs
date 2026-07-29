//! Stage 1: Content Type Classification
//!
//! Runs all registered content type detectors against the input text,
//! selects the highest-confidence result above the threshold, and
//! falls back to PlainText when confidence is insufficient.
//!
//! Key design principles:
//! - Every detector scores independently (no first-match-wins).
//! - The natural language ratio suppresses false-positive code detection.
//! - Structured data formats (JSON, YAML, XML) use parse validation.
//! - Multiple independent signals required — never one keyword.

use crate::domain::classifier::*;

// ═══════════════════════════════════════════════════════════════════════
// Content Classifier (orchestrator)
// ═══════════════════════════════════════════════════════════════════════

/// The Stage 1 classifier. Runs all registered detectors and picks
/// the highest-confidence result.
pub struct ContentClassifier {
    detectors: Vec<Box<dyn ContentDetector>>,
}

impl ContentClassifier {
    /// Creates a new classifier with the standard detector set.
    pub fn new() -> Self {
        Self {
            detectors: vec![
                // Atomic types (single-value, no ambiguity)
                Box::new(UrlDetector),
                Box::new(EmailDetector),
                Box::new(FilePathDetector),
                Box::new(PhoneDetector),
                // Structured data formats (parse-validated)
                Box::new(JsonDetector),
                Box::new(XmlDetector),
                Box::new(YamlDetector),
                // Markup languages
                Box::new(HtmlDetector),
                Box::new(MarkdownDetector),
                Box::new(CssDetector),
                // Environment / output
                Box::new(DiffDetector),
                Box::new(TerminalDetector),
                Box::new(LogDetector),
                Box::new(DockerDetector),
                // Source code (gating for Stage 2)
                Box::new(SourceCodeDetector),
            ],
        }
    }

    /// Classify the given metrics.text. Returns the best content type classification.
    pub fn classify(&self, text: &str) -> ContentClassification {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return ContentClassification::plain_text();
        }

        let metrics = TextMetrics::compute(trimmed);
        let nl_ratio = metrics.nl_ratio;

        let mut signals: Vec<DetectionSignal> = Vec::new();

        for detector in &self.detectors {
            let mut signal = detector.detect(&metrics);

            // Apply natural language penalty to code-like signals.
            if signal.detected_type == DetectedContentType::SourceCode
                && nl_ratio > CONTENT_NL_PENALTY_THRESHOLD
            {
                let penalty = nl_ratio * CONTENT_NL_PENALTY_MULTIPLIER; // Up to 60% penalty
                signal.confidence *= 1.0 - penalty;
                signal.reasons.push(format!(
                    "prose ratio {:.0}% — confidence reduced by {:.0}%",
                    nl_ratio * 100.0,
                    penalty * 100.0
                ));
            }

            if signal.confidence > 0.0 {
                signals.push(signal);
            }
        }

        signals.sort_by(|a, b| {
            b.confidence
                .partial_cmp(&a.confidence)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        if signals.is_empty() {
            return ContentClassification::plain_text();
        }

        let mut best = signals[0].clone();

        if best.confidence >= CONTENT_TYPE_THRESHOLD {
            if signals.len() > 1 {
                let second = &signals[1];
                let gap = best.confidence - second.confidence;
                if gap < CONFIDENCE_GAP_THRESHOLD {
                    tracing::trace!(
                        "Ambiguity detected between {:?} ({:.2}) and {:?} ({:.2})",
                        best.detected_type,
                        best.confidence,
                        second.detected_type,
                        second.confidence
                    );

                    let types = (best.detected_type.clone(), second.detected_type.clone());

                    if types.0 == DetectedContentType::PlainText {
                        // Already PlainText, keep best
                    } else if types.1 == DetectedContentType::PlainText {
                        best = second.clone();
                    } else if types.0 == DetectedContentType::Markdown
                        && types.1 == DetectedContentType::SourceCode
                    {
                        // Already Markdown, keep best
                    } else if types.0 == DetectedContentType::SourceCode
                        && types.1 == DetectedContentType::Markdown
                    {
                        best = second.clone();
                    } else {
                        return ContentClassification::plain_text();
                    }
                }
            }

            return ContentClassification {
                content_type: best.detected_type,
                confidence: best.confidence,
                language: None,
                reasoning: best.reasons,
            };
        }

        ContentClassification::plain_text()
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Atomic Type Detectors
// ═══════════════════════════════════════════════════════════════════════

struct UrlDetector;
impl ContentDetector for UrlDetector {
    fn name(&self) -> &'static str {
        "url"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        let is_single_line = !t.contains('\n');
        let is_url = is_single_line
            && !t.contains(' ')
            && (t.starts_with("http://")
                || t.starts_with("https://")
                || t.starts_with("ftp://")
                || t.starts_with("ssh://")
                || (t.starts_with("www.") && t.contains('.')));

        DetectionSignal {
            detected_type: DetectedContentType::Url,
            confidence: if is_url { 0.98 } else { 0.0 },
            reasons: if is_url {
                vec!["URL protocol prefix".into()]
            } else {
                vec![]
            },
        }
    }
}

struct EmailDetector;
impl ContentDetector for EmailDetector {
    fn name(&self) -> &'static str {
        "email"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        let is_single_line = !t.contains('\n') && !t.contains(' ');
        let is_email = is_single_line && {
            let parts: Vec<&str> = t.split('@').collect();
            parts.len() == 2
                && !parts[0].is_empty()
                && parts[1].contains('.')
                && !parts[1].starts_with('.')
                && !parts[1].ends_with('.')
        };

        DetectionSignal {
            detected_type: DetectedContentType::Email,
            confidence: if is_email { 0.95 } else { 0.0 },
            reasons: if is_email {
                vec!["user@domain.tld pattern".into()]
            } else {
                vec![]
            },
        }
    }
}

struct FilePathDetector;
impl ContentDetector for FilePathDetector {
    fn name(&self) -> &'static str {
        "file_path"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        if t.contains('\n') || t.len() > 500 {
            return DetectionSignal {
                detected_type: DetectedContentType::FilePath,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        let is_unix = t.starts_with('/')
            || t.starts_with("~/")
            || t.starts_with("./")
            || t.starts_with("../");
        let is_windows = t.len() >= 3
            && t.as_bytes()[0].is_ascii_alphabetic()
            && t.as_bytes()[1] == b':'
            && (t.as_bytes()[2] == b'\\' || t.as_bytes()[2] == b'/');

        let is_path = is_unix || is_windows;
        DetectionSignal {
            detected_type: DetectedContentType::FilePath,
            confidence: if is_path { 0.90 } else { 0.0 },
            reasons: if is_path {
                vec!["filesystem path prefix".into()]
            } else {
                vec![]
            },
        }
    }
}

struct PhoneDetector;
impl ContentDetector for PhoneDetector {
    fn name(&self) -> &'static str {
        "phone"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        let valid = t.len() >= 7
            && t.len() <= 25
            && !t.contains('\n')
            && t.chars().all(|c| c.is_ascii_digit() || "+- ()".contains(c))
            && t.chars().filter(|c| c.is_ascii_digit()).count() >= 7;

        DetectionSignal {
            detected_type: DetectedContentType::Phone,
            confidence: if valid { 0.85 } else { 0.0 },
            reasons: if valid {
                vec!["phone number pattern".into()]
            } else {
                vec![]
            },
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Structured Data Detectors
// ═══════════════════════════════════════════════════════════════════════

struct JsonDetector;
impl ContentDetector for JsonDetector {
    fn name(&self) -> &'static str {
        "json"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        let looks_json =
            (t.starts_with('{') && t.ends_with('}')) || (t.starts_with('[') && t.ends_with(']'));

        if looks_json && serde_json::from_str::<serde_json::Value>(t).is_ok() {
            DetectionSignal {
                detected_type: DetectedContentType::Json,
                confidence: 0.98,
                reasons: vec!["valid JSON parse".into()],
            }
        } else {
            DetectionSignal {
                detected_type: DetectedContentType::Json,
                confidence: 0.0,
                reasons: vec![],
            }
        }
    }
}

struct XmlDetector;
impl ContentDetector for XmlDetector {
    fn name(&self) -> &'static str {
        "xml"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        let lower = t.to_lowercase();

        // Must look like XML: starts with <, ends with >, has closing tags
        if !t.starts_with('<') || !t.ends_with('>') || !t.contains("</") {
            return DetectionSignal {
                detected_type: DetectedContentType::Xml,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        // Exclude HTML (handled by HtmlDetector)
        let html_indicators = [
            "<html",
            "<div",
            "<span",
            "<p>",
            "<p ",
            "<body",
            "<head",
            "<table",
            "<form",
            "<input",
            "<button",
            "<a ",
            "<a>",
            "<img",
            "<ul",
            "<ol",
            "<li",
            "<h1",
            "<h2",
            "<h3",
            "doctype html",
        ];
        if html_indicators.iter().any(|tag| lower.contains(tag)) {
            return DetectionSignal {
                detected_type: DetectedContentType::Xml,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        // Check for XML declaration or namespace
        let mut confidence = 0.70;
        let mut reasons = vec!["XML tag structure".into()];
        if lower.starts_with("<?xml") {
            confidence = 0.95;
            reasons.push("XML declaration".into());
        }
        if lower.contains("xmlns") {
            confidence = (confidence + 0.15_f64).min(1.0);
            reasons.push("XML namespace".into());
        }

        DetectionSignal {
            detected_type: DetectedContentType::Xml,
            confidence,
            reasons,
        }
    }
}

struct YamlDetector;
impl ContentDetector for YamlDetector {
    fn name(&self) -> &'static str {
        "yaml"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let t = metrics.text;
        // YAML should not look like JSON
        if t.starts_with('{') || t.starts_with('[') {
            return DetectionSignal {
                detected_type: DetectedContentType::Yaml,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        let lines: Vec<&str> = t.lines().collect();
        if lines.is_empty() {
            return DetectionSignal {
                detected_type: DetectedContentType::Yaml,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // YAML document separator
        if t.starts_with("---") {
            score += 0.30;
            reasons.push("YAML document separator".into());
        }

        // Count key: value lines (key must be a simple identifier)
        let kv_lines = lines
            .iter()
            .filter(|l| {
                let trimmed = l.trim();
                if let Some(colon_pos) = trimmed.find(':') {
                    let key = &trimmed[..colon_pos];
                    // Key should be a simple identifier, not a sentence
                    !key.is_empty()
                        && key.split_whitespace().count() <= 2
                        && !key.contains('(')
                        && !key.contains(')')
                } else {
                    false
                }
            })
            .count();

        let kv_ratio = kv_lines as f64 / lines.len().max(1) as f64;
        if kv_ratio > 0.4 {
            score += 0.40;
            reasons.push(format!("{:.0}% key:value lines", kv_ratio * 100.0));
        }

        // Indented list items
        let indent_lists = lines
            .iter()
            .filter(|l| {
                let trimmed = l.trim_start();
                trimmed.starts_with("- ") && l.len() != trimmed.len()
            })
            .count();
        if indent_lists >= 2 {
            score += 0.20;
            reasons.push(format!("{} indented list items", indent_lists));
        }

        // Require at least two signals
        if reasons.len() < 2 {
            score = score.min(0.30);
        }

        DetectionSignal {
            detected_type: DetectedContentType::Yaml,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Markup Detectors
// ═══════════════════════════════════════════════════════════════════════

struct HtmlDetector;
impl ContentDetector for HtmlDetector {
    fn name(&self) -> &'static str {
        "html"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let lower = &metrics.lower;
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if lower.contains("<!doctype html") || lower.contains("<html") {
            score += 0.70;
            reasons.push("HTML document root".into());
        }
        // Require paired tags, not just opening tags
        let paired_tags = [
            "div", "span", "p", "body", "head", "table", "form", "ul", "ol", "li", "section",
            "article", "nav", "header", "footer",
        ];
        let paired_count = paired_tags
            .iter()
            .filter(|tag| {
                let open = format!("<{}", tag);
                let close = format!("</{}>", tag);
                lower.contains(&open) && lower.contains(&close)
            })
            .count();

        if paired_count >= 2 {
            score += 0.50;
            reasons.push(format!("{} paired HTML tags", paired_count));
        } else if paired_count == 1 {
            score += 0.30;
            reasons.push("1 paired HTML tag".into());
        }

        // HTML attributes
        if lower.contains("class=\"") || lower.contains("id=\"") || lower.contains("style=\"") {
            score += 0.15;
            reasons.push("HTML attributes".into());
        }

        DetectionSignal {
            detected_type: DetectedContentType::Html,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

struct MarkdownDetector;
impl ContentDetector for MarkdownDetector {
    fn name(&self) -> &'static str {
        "markdown"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let mut signals = 0u32;
        let mut reasons = Vec::new();

        // ATX headers
        let has_headers = metrics.text.lines().any(|l| {
            let t = l.trim();
            t.starts_with("# ") || t.starts_with("## ") || t.starts_with("### ")
        });
        if has_headers {
            signals += 1;
            reasons.push("ATX headers".into());
        }

        // Markdown links [text](url)
        if metrics.text.contains("](") && metrics.text.contains('[') {
            signals += 1;
            reasons.push("markdown links".into());
        }

        // Bold/italic emphasis
        if metrics.text.contains("**") || metrics.text.contains("__") {
            signals += 1;
            reasons.push("bold/italic emphasis".into());
        }

        // List items (multiple)
        let list_count = metrics
            .lines
            .iter()
            .filter(|l| {
                let t = l.trim_start();
                t.starts_with("- ") || t.starts_with("* ") || t.starts_with("1. ")
            })
            .count();
        if list_count >= 2 {
            signals += 1;
            reasons.push(format!("{} list items", list_count));
        }

        // Fenced code blocks
        if metrics.text.contains("```") {
            signals += 1;
            reasons.push("fenced code blocks".into());
        }

        // Require ≥2 independent signals to avoid false positives
        let confidence = match signals {
            0 | 1 => 0.0,
            2 => 0.65,
            3 => 0.80,
            _ => 0.92,
        };

        DetectionSignal {
            detected_type: DetectedContentType::Markdown,
            confidence,
            reasons,
        }
    }
}

struct CssDetector;
impl ContentDetector for CssDetector {
    fn name(&self) -> &'static str {
        "css"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // Selector + block pattern
        let has_blocks = metrics.text.contains('{') && metrics.text.contains('}');
        if !has_blocks {
            return DetectionSignal {
                detected_type: DetectedContentType::Css,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        // CSS properties
        let css_props = [
            "color:",
            "background:",
            "display:",
            "margin:",
            "padding:",
            "font-size:",
            "border:",
            "width:",
            "height:",
            "position:",
            "flex:",
            "grid:",
            "transform:",
            "opacity:",
            "z-index:",
        ];
        let prop_count = css_props
            .iter()
            .filter(|p| metrics.text.contains(*p))
            .count();
        if prop_count >= 2 {
            score += 0.50;
            reasons.push(format!("{} CSS properties", prop_count));
        }

        // CSS selectors
        if metrics.text.contains(".") && metrics.text.contains('{')
            || metrics.text.contains('#') && metrics.text.contains('{')
        {
            score += 0.20;
            reasons.push("CSS selectors".into());
        }

        // @rules
        if metrics.text.contains("@media")
            || metrics.text.contains("@keyframes")
            || metrics.text.contains("@import")
        {
            score += 0.25;
            reasons.push("CSS @-rules".into());
        }

        DetectionSignal {
            detected_type: DetectedContentType::Css,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Environment / Output Detectors
// ═══════════════════════════════════════════════════════════════════════

struct DiffDetector;
impl ContentDetector for DiffDetector {
    fn name(&self) -> &'static str {
        "diff"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("diff --git") {
            score += 0.80;
            reasons.push("git diff header".into());
        }
        if metrics.text.contains("--- a/") && metrics.text.contains("+++ b/") {
            score += 0.70;
            reasons.push("unified diff markers".into());
        }
        if metrics.text.contains("@@ ") && metrics.text.contains(" @@") {
            score += 0.30;
            reasons.push("hunk headers".into());
        }
        // Require at least one strong signal
        if metrics.text.starts_with("Index: ") && metrics.text.contains("===") {
            score += 0.60;
            reasons.push("SVN diff format".into());
        }

        DetectionSignal {
            detected_type: DetectedContentType::GitDiff,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

struct TerminalDetector;
impl ContentDetector for TerminalDetector {
    fn name(&self) -> &'static str {
        "terminal"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // ANSI escape codes (very strong signal)
        if metrics.text.contains("\x1b[") {
            score += 0.85;
            reasons.push("ANSI escape codes".into());
        }

        // Shell prompts
        let prompt_lines = metrics
            .text
            .lines()
            .filter(|l| {
                let t = l.trim();
                t.starts_with("$ ")
                    || t.contains("~$ ")
                    || t.contains("# ") && t.contains("root@")
                    || t.contains("➜")
            })
            .count();
        let prompt_ratio = prompt_lines as f64 / metrics.text.lines().count().max(1) as f64;
        if prompt_ratio > 0.2 {
            score += 0.50;
            reasons.push(format!("{:.0}% prompt lines", prompt_ratio * 100.0));
        }

        DetectionSignal {
            detected_type: DetectedContentType::TerminalOutput,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

struct LogDetector;
impl ContentDetector for LogDetector {
    fn name(&self) -> &'static str {
        "log"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let lines = &metrics.lines;
        if lines.is_empty() {
            return DetectionSignal {
                detected_type: DetectedContentType::LogFile,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        // Require STRUCTURED log patterns, not just keywords.
        // A log line typically has: [LEVEL] or timestamp + LEVEL
        let structured_log_count = lines
            .iter()
            .filter(|line| {
                let l = line.trim();
                // Pattern 1: Bracketed level [INFO], [WARN], [ERROR], [DEBUG], [TRACE]
                let has_bracketed = l.contains("[INFO]")
                    || l.contains("[WARN]")
                    || l.contains("[ERROR]")
                    || l.contains("[DEBUG]")
                    || l.contains("[TRACE]")
                    || l.contains("] INFO")
                    || l.contains("] WARN")
                    || l.contains("] ERROR")
                    || l.contains("] DEBUG");
                // Pattern 2: Timestamp-prefixed with level
                let has_timestamped = l.len() > 20
                    && l.chars().take(4).all(|c| c.is_ascii_digit())
                    && l.contains('-')
                    && (l.contains(" INFO ")
                        || l.contains(" WARN ")
                        || l.contains(" ERROR ")
                        || l.contains(" DEBUG ")
                        || l.contains(" TRACE "));

                has_bracketed || has_timestamped
            })
            .count();

        let ratio = structured_log_count as f64 / lines.len() as f64;
        let confidence = if ratio > 0.5 {
            0.90
        } else if ratio > 0.25 {
            0.65
        } else {
            0.0
        };

        let reasons = if confidence > 0.0 {
            vec![format!(
                "{:.0}% structured log lines ({}/{})",
                ratio * 100.0,
                structured_log_count,
                lines.len()
            )]
        } else {
            vec![]
        };

        DetectionSignal {
            detected_type: DetectedContentType::LogFile,
            confidence,
            reasons,
        }
    }
}

struct DockerDetector;
impl ContentDetector for DockerDetector {
    fn name(&self) -> &'static str {
        "docker"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let upper = &metrics.upper;
        let lines = &metrics.lines;
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // FROM instruction (required for Dockerfile)
        let has_from = lines
            .iter()
            .any(|l| l.trim_start().to_uppercase().starts_with("FROM "));
        if !has_from {
            return DetectionSignal {
                detected_type: DetectedContentType::Docker,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        score += 0.40;
        reasons.push("FROM instruction".into());

        // Docker-specific instructions
        let docker_instructions = [
            "RUN ",
            "CMD ",
            "COPY ",
            "WORKDIR ",
            "EXPOSE ",
            "ENV ",
            "ENTRYPOINT ",
            "VOLUME ",
            "ADD ",
            "ARG ",
            "LABEL ",
        ];
        let instruction_count = docker_instructions
            .iter()
            .filter(|inst| upper.contains(*inst))
            .count();
        if instruction_count >= 2 {
            score += 0.40;
            reasons.push(format!("{} Dockerfile instructions", instruction_count));
        }

        DetectionSignal {
            detected_type: DetectedContentType::Docker,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Source Code Detector (Stage 1 gating for Stage 2)
// ═══════════════════════════════════════════════════════════════════════

struct SourceCodeDetector;
impl ContentDetector for SourceCodeDetector {
    fn name(&self) -> &'static str {
        "source_code"
    }
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {
        let lines = &metrics.lines;
        if lines.is_empty() {
            return DetectionSignal {
                detected_type: DetectedContentType::SourceCode,
                confidence: 0.0,
                reasons: vec![],
            };
        }

        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // ── Structural code indicators ────────────────────────

        // Balanced braces/brackets (strong code signal)
        let open_braces = metrics.open_braces;
        let close_braces = metrics.close_braces;
        if open_braces >= 2 && open_braces == close_braces {
            score += 0.25;
            reasons.push(format!("{} balanced brace pairs", open_braces));
        }

        // Semicolon-terminated lines (common in many languages)
        let semi_lines = lines.iter().filter(|l| l.trim().ends_with(';')).count();
        let semi_ratio = semi_lines as f64 / lines.len() as f64;
        if semi_ratio > 0.3 {
            score += 0.25;
            reasons.push(format!(
                "{:.0}% semicolon-terminated lines",
                semi_ratio * 100.0
            ));
        }

        // Consistent indentation (2 or 4 spaces, or tabs)
        let indented_lines = lines
            .iter()
            .filter(|l| l.starts_with("    ") || l.starts_with("  ") || l.starts_with('\t'))
            .count();
        let indent_ratio = indented_lines as f64 / lines.len() as f64;
        if indent_ratio > 0.3 && lines.len() > 3 {
            score += 0.15;
            reasons.push(format!("{:.0}% indented lines", indent_ratio * 100.0));
        }

        // Code comment syntax
        let comment_lines = lines
            .iter()
            .filter(|l| {
                let t = l.trim();
                t.starts_with("//")
                    || t.starts_with('#')
                    || t.starts_with("/*")
                    || t.starts_with("* ")
                    || t.starts_with("*/")
            })
            .count();
        if comment_lines >= 2 {
            score += 0.10;
            reasons.push(format!("{} comment lines", comment_lines));
        }

        // Programming operators (not common in prose)
        let operator_count = [
            "==", "!=", "<=", ">=", "&&", "||", "=>", "->", "::", "+=", "-=",
        ]
        .iter()
        .filter(|op| metrics.text.contains(*op))
        .count();
        if operator_count >= 2 {
            score += 0.20;
            reasons.push(format!("{} programming operators", operator_count));
        }

        // Function/method calls: identifier(args)
        let call_pattern_count = lines
            .iter()
            .filter(|l| {
                let t = l.trim();
                // Look for word( pattern that isn't a natural language parenthetical
                t.contains("(") && t.contains(")") && {
                    // Check if there's an identifier immediately before (
                    if let Some(pos) = t.find('(') {
                        pos > 0 && t.as_bytes()[pos - 1].is_ascii_alphanumeric()
                    } else {
                        false
                    }
                }
            })
            .count();
        let call_ratio = call_pattern_count as f64 / lines.len() as f64;
        if call_ratio > 0.2 {
            score += 0.20;
            reasons.push(format!("{:.0}% function call lines", call_ratio * 100.0));
        }

        // ── Anti-signals ──────────────────────────────────────
        // Note: The natural language penalty is applied by the classifier,
        // not here. This detector just reports raw code-likelihood.

        DetectionSignal {
            detected_type: DetectedContentType::SourceCode,
            confidence: score.min(1.0),
            reasons,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    fn classifier() -> ContentClassifier {
        ContentClassifier::new()
    }

    // ── Atomic types ──────────────────────────────────────────

    #[test]
    fn test_url() {
        let c = classifier();
        let r = c.classify("https://github.com/sanromarth/ornas");
        assert_eq!(r.content_type, DetectedContentType::Url);
    }

    #[test]
    fn test_email() {
        let c = classifier();
        let r = c.classify("user@example.com");
        assert_eq!(r.content_type, DetectedContentType::Email);
    }

    #[test]
    fn test_file_path_unix() {
        let c = classifier();
        let r = c.classify("/usr/local/bin/ornas");
        assert_eq!(r.content_type, DetectedContentType::FilePath);
    }

    #[test]
    fn test_phone() {
        let c = classifier();
        let r = c.classify("+1-800-555-0199");
        assert_eq!(r.content_type, DetectedContentType::Phone);
    }

    // ── Structured data ───────────────────────────────────────

    #[test]
    fn test_json_object() {
        let c = classifier();
        let r = c.classify(r#"{"key": "value", "num": 42}"#);
        assert_eq!(r.content_type, DetectedContentType::Json);
    }

    #[test]
    fn test_json_array() {
        let c = classifier();
        let r = c.classify(r#"[1, 2, 3, "hello"]"#);
        assert_eq!(r.content_type, DetectedContentType::Json);
    }

    // ── Markup ────────────────────────────────────────────────

    #[test]
    fn test_markdown() {
        let c = classifier();
        let r = c.classify("# Title\n## Section\n- item 1\n- item 2\n\n**bold** text");
        assert_eq!(r.content_type, DetectedContentType::Markdown);
    }

    #[test]
    fn test_html() {
        let c = classifier();
        let r = c.classify("<html><body><div class=\"test\">hello</div></body></html>");
        assert_eq!(r.content_type, DetectedContentType::Html);
    }

    // ── Environment ───────────────────────────────────────────

    #[test]
    fn test_git_diff() {
        let c = classifier();
        let r = c.classify(
            "diff --git a/file.rs b/file.rs\n--- a/file.rs\n+++ b/file.rs\n@@ -1,3 +1,3 @@",
        );
        assert_eq!(r.content_type, DetectedContentType::GitDiff);
    }

    #[test]
    fn test_docker() {
        let c = classifier();
        let r = c.classify("FROM ubuntu:22.04\nRUN apt-get update\nCOPY . /app\nWORKDIR /app");
        assert_eq!(r.content_type, DetectedContentType::Docker);
    }

    #[test]
    fn test_structured_log() {
        let c = classifier();
        let r = c.classify("[INFO] Server started\n[DEBUG] Loading config\n[INFO] Listening on :8080\n[WARN] Deprecated API used");
        assert_eq!(r.content_type, DetectedContentType::LogFile);
    }

    #[test]
    fn test_unstructured_error_mention_not_log() {
        let c = classifier();
        // Just mentioning "ERROR" in prose should NOT classify as log
        let r = c.classify("The error handling module is important for reliability. Information about debugging can be found in the docs.");
        assert_ne!(r.content_type, DetectedContentType::LogFile);
    }

    // ── Plain text (must NOT be misclassified) ────────────────

    #[test]
    fn test_plain_text() {
        let c = classifier();
        let r = c.classify("Just a simple note about something.");
        assert_eq!(r.content_type, DetectedContentType::PlainText);
    }

    #[test]
    fn test_meeting_notes_not_sql() {
        let c = classifier();
        let r = c.classify(
            "Meeting Notes 2026-07-28\n\
             - Select the items from the backlog\n\
             - Delete old branches after review\n\
             - Update the project status page\n\
             - Insert the new team members into the org chart",
        );
        assert_eq!(
            r.content_type,
            DetectedContentType::PlainText,
            "Meeting notes with SQL-adjacent words must be PlainText, got {:?}",
            r.content_type
        );
    }

    #[test]
    fn test_prose_with_common_keywords() {
        let c = classifier();
        let r = c.classify(
            "Let me know when the review is done. The import of the dataset was successful.\n\
             We need to define the class schedule for next semester. Please use the approved format."
        );
        assert_eq!(r.content_type, DetectedContentType::PlainText);
    }

    // Very small snippets
    #[test]
    fn test_single_word() {
        let c = classifier();
        assert_eq!(
            c.classify("hello").content_type,
            DetectedContentType::PlainText
        );
    }

    #[test]
    fn test_empty_string() {
        let c = classifier();
        assert_eq!(c.classify("").content_type, DetectedContentType::PlainText);
    }

    #[test]
    fn test_whitespace_only() {
        let c = classifier();
        assert_eq!(
            c.classify("   \n\n  ").content_type,
            DetectedContentType::PlainText
        );
    }

    // Config file detection
    #[test]
    fn test_yaml_config() {
        let c = classifier();
        let r = c.classify("---\nname: ornas\nversion: 1.0\ndependencies:\n  - serde\n  - tokio");
        assert_eq!(r.content_type, DetectedContentType::Yaml);
    }

    #[test]
    fn test_xml_with_declaration() {
        let c = classifier();
        let r = c.classify("<?xml version=\"1.0\"?>\n<config>\n  <setting name=\"theme\">dark</setting>\n</config>");
        assert_eq!(r.content_type, DetectedContentType::Xml);
    }

    // Windows file path
    #[test]
    fn test_file_path_windows() {
        let c = classifier();
        let r = c.classify("C:\\Users\\sanro\\Documents\\file.txt");
        assert_eq!(r.content_type, DetectedContentType::FilePath);
    }

    // CSS with @media
    #[test]
    fn test_css_with_media_query() {
        let c = classifier();
        let r = c.classify(".container {\n  display: flex;\n  margin: 0 auto;\n}\n@media (max-width: 768px) {\n  .container { flex-direction: column; }\n}");
        assert_eq!(r.content_type, DetectedContentType::Css);
    }

    // Mixed markdown with embedded code (should be Markdown, not SourceCode)
    #[test]
    fn test_markdown_with_code_block() {
        let c = classifier();
        let r = c.classify("# Installation\n\n```bash\nnpm install ornas\n```\n\n## Usage\n\n- Import the module\n- Call `init()`");
        assert_eq!(
            r.content_type,
            DetectedContentType::Markdown,
            "Markdown with embedded code should be Markdown, got {:?}",
            r.content_type
        );
    }

    // Natural language with programming terminology
    #[test]
    fn test_technical_prose_not_code() {
        let c = classifier();
        let r = c.classify(
        "The function returns a boolean value. We should refactor the class to use interfaces.\n\
         The import statement brings in external modules. Each variable should have a clear type."
    );
        assert_eq!(
            r.content_type,
            DetectedContentType::PlainText,
            "Technical prose must be PlainText, got {:?}",
            r.content_type
        );
    }
}
