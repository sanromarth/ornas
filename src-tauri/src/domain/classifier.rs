//! Classification domain types — confidence-based content and language classification.
//!
//! This module defines the core types and traits for ORNAS's two-stage
//! classification engine:
//!
//! - **Stage 1**: Content Type Classification — determines WHAT the content is
//!   (plain text, source code, markdown, JSON, etc.)
//! - **Stage 2**: Language Classification — determines WHICH programming language,
//!   only invoked when Stage 1 identifies source code with sufficient confidence.

use serde::{Deserialize, Serialize};

// ─── Confidence Thresholds ────────────────────────────────────────────

/// Minimum confidence required to accept a content type classification.
/// Below this threshold, the engine falls back to PlainText.
pub const CONTENT_TYPE_THRESHOLD: f64 = 0.50;

/// Minimum confidence required to accept a programming language classification.
/// Below this threshold, no language is assigned.
pub const LANGUAGE_THRESHOLD: f64 = 0.50;

/// Minimum confidence from the SourceCode content detector before
/// Stage 2 (language detection) is invoked at all.
pub const SOURCE_CODE_GATE_THRESHOLD: f64 = 0.55;

pub const CONFIDENCE_GAP_THRESHOLD: f64 = 0.10;

// ─── Natural Language Penalties ───────────────────────────
/// NL ratio above this triggers SourceCode content penalty.
pub const CONTENT_NL_PENALTY_THRESHOLD: f64 = 0.40;
/// Penalty multiplier for content detection.
pub const CONTENT_NL_PENALTY_MULTIPLIER: f64 = 0.60;
/// NL ratio above this triggers language detection penalty.
pub const LANGUAGE_NL_PENALTY_THRESHOLD: f64 = 0.55;
/// Penalty multiplier for language detection.
pub const LANGUAGE_NL_PENALTY_MULTIPLIER: f64 = 0.40;

// ─── Content Type (Stage 1) ───────────────────────────────────────────

/// High-level content types detected by Stage 1.
///
/// These represent WHAT the clipboard contains, independent of any
/// programming language.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectedContentType {
    PlainText,
    SourceCode,
    Markdown,
    Html,
    Css,
    Json,
    Yaml,
    Xml,
    Url,
    Email,
    FilePath,
    Phone,
    TerminalOutput,
    GitDiff,
    LogFile,
    Docker,
}

impl DetectedContentType {
    /// Returns the category string stored in the database.
    pub fn as_category_str(&self) -> &'static str {
        match self {
            Self::PlainText => "plain_text",
            Self::SourceCode => "code",
            Self::Markdown => "markdown",
            Self::Html => "html",
            Self::Css => "css",
            Self::Json => "json",
            Self::Yaml => "yaml",
            Self::Xml => "xml",
            Self::Url => "url",
            Self::Email => "email",
            Self::FilePath => "file_path",
            Self::Phone => "phone",
            Self::TerminalOutput => "terminal_output",
            Self::GitDiff => "diff",
            Self::LogFile => "log",
            Self::Docker => "docker",
        }
    }
}

// ─── Detection Signals ────────────────────────────────────────────────

/// A detection signal emitted by a single content type detector.
#[derive(Debug, Clone)]
pub struct DetectionSignal {
    pub detected_type: DetectedContentType,
    pub confidence: f64,
    pub reasons: Vec<String>,
}

/// The complete result of content type classification (Stage 1).
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ContentClassification {
    pub content_type: DetectedContentType,
    pub confidence: f64,
    pub language: Option<LanguageClassification>,
    pub reasoning: Vec<String>,
}

impl ContentClassification {
    /// Shorthand for a PlainText result with no language.
    pub fn plain_text() -> Self {
        Self {
            content_type: DetectedContentType::PlainText,
            confidence: 1.0,
            language: None,
            reasoning: vec!["No strong structural signals detected".into()],
        }
    }
}

// ─── Language Classification (Stage 2) ────────────────────────────────

/// The result of programming language classification.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct LanguageClassification {
    pub language: String,
    pub confidence: f64,
    pub reasoning: Vec<String>,
}

/// A score returned by a single language detector.
#[derive(Debug, Clone)]
pub struct LanguageScore {
    pub language: &'static str,
    pub score: f64,
    pub reasons: Vec<String>,
}

// ─── Text Metrics ─────────────────────────────────────────────────────

/// Pre-computed text metrics shared across all detectors.
/// Computed once by the classifier, avoiding duplicate scans.
#[allow(dead_code)]
pub struct TextMetrics<'a> {
    /// Original trimmed text.
    pub text: &'a str,
    /// Lines of the text.
    pub lines: Vec<&'a str>,
    /// Lowercase copy.
    pub lower: String,
    /// Uppercase copy.
    pub upper: String,
    /// Total line count.
    pub line_count: usize,
    /// Pre-computed natural language ratio.
    pub nl_ratio: f64,
    /// Count of '{' characters.
    pub open_braces: usize,
    /// Count of '}' characters.
    pub close_braces: usize,
    /// Lines ending with ';'.
    pub semicolon_lines: usize,
}

impl<'a> TextMetrics<'a> {
    /// Compute all metrics from the given (already trimmed) text.
    pub fn compute(text: &'a str) -> Self {
        let lines: Vec<&str> = text.lines().collect();
        let line_count = lines.len();
        let lower = text.to_lowercase();
        let upper = text.to_uppercase();
        let nl_ratio = natural_language_ratio(text);
        let open_braces = text.chars().filter(|c| *c == '{').count();
        let close_braces = text.chars().filter(|c| *c == '}').count();
        let semicolon_lines = lines.iter().filter(|l| l.trim().ends_with(';')).count();
        Self {
            text,
            lines,
            lower,
            upper,
            line_count,
            nl_ratio,
            open_braces,
            close_braces,
            semicolon_lines,
        }
    }
}

// ─── Detector Traits (Strategy Pattern) ───────────────────────────────

/// Trait for content type detectors (Stage 1 registry).
///
/// Each implementation detects one content type and returns a confidence
/// score. The classifier runs ALL detectors and picks the highest score.
#[allow(unused)]
pub trait ContentDetector: Send + Sync {
    /// Human-readable name for logging.
    fn name(&self) -> &'static str;

    /// Analyze the text and return a detection signal.
    /// Return confidence 0.0 if this content type is not detected.
    fn detect(&self, metrics: &TextMetrics) -> DetectionSignal;
}

/// Trait for programming language detectors (Stage 2 registry).
///
/// Each implementation scores one programming language.
/// Only invoked when Stage 1 identifies SourceCode.
#[allow(unused)]
pub trait LanguageDetector: Send + Sync {
    /// Human-readable name for logging.
    fn name(&self) -> &'static str;

    /// Score the text for this language. Higher = more confident.
    fn score(&self, metrics: &TextMetrics) -> LanguageScore;
}

// ─── Text Analysis Utilities ──────────────────────────────────────────

/// Computes the ratio of "natural language" lines to total lines.
///
/// A line is considered natural language if it exhibits multiple
/// prose characteristics: starts with uppercase, ends with sentence
/// punctuation, contains 4+ words, and lacks programming-specific
/// punctuation clusters.
///
/// This ratio is used as an anti-signal to suppress false positives
/// from code detectors when content is predominantly prose.
pub fn natural_language_ratio(text: &str) -> f64 {
    let lines: Vec<&str> = text.lines().collect();
    if lines.is_empty() {
        return 0.0;
    }
    let total = lines.len() as f64;

    let prose_lines = lines
        .iter()
        .filter(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return false;
            }

            let words: Vec<&str> = trimmed.split_whitespace().collect();
            let word_count = words.len();
            let starts_upper = trimmed.chars().next().is_some_and(|c| c.is_uppercase());
            let ends_sentence = trimmed.ends_with('.')
                || trimmed.ends_with(',')
                || trimmed.ends_with(':')
                || trimmed.ends_with('!')
                || trimmed.ends_with('?');
            let has_enough_words = word_count >= 4;

            // Programming punctuation clusters that rarely appear in prose
            let has_code_punctuation = trimmed.contains("()")
                || trimmed.contains("{}")
                || trimmed.contains("[];")
                || trimmed.contains("=>")
                || trimmed.contains("->")
                || trimmed.contains("::");

            // A line is "prose" if it looks like a natural language sentence
            let is_prose_sentence = starts_upper && has_enough_words && !has_code_punctuation;
            let is_prose_continuation = ends_sentence && has_enough_words && !has_code_punctuation;
            // Bullet points in docs are also prose
            let is_bullet = (trimmed.starts_with("- ")
                || trimmed.starts_with("• ")
                || trimmed.starts_with("* "))
                && word_count >= 3
                && !has_code_punctuation;

            is_prose_sentence || is_prose_continuation || is_bullet
        })
        .count() as f64;

    prose_lines / total
}

/// Counts lines matching a predicate, returning the ratio.
#[allow(dead_code)]
pub fn line_ratio(text: &str, predicate: impl Fn(&str) -> bool) -> f64 {
    let lines: Vec<&str> = text.lines().collect();
    if lines.is_empty() {
        return 0.0;
    }
    let matches = lines.iter().filter(|l| predicate(l)).count() as f64;
    matches / lines.len() as f64
}
