//! Content category detection — pure functions for classifying clipboard content.
//!
//! Each detection function is a pure function that takes a `&str` and returns
//! a boolean. The categorizer runs them in priority order; first match wins.

use serde::{Deserialize, Serialize};

/// Content categories detected automatically by the pipeline.
///
/// The variant order defines detection priority (first match wins).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ContentCategory {
    Url,
    Email,
    FilePath,
    Json,
    Xml,
    Markdown,
    Sql,
    Shell,
    Python,
    JavaScript,
    Rust,
    Html,
    Css,
    Git,
    Docker,
    Phone,
    PlainText,
}

impl ContentCategory {
    /// Returns the string representation stored in the database.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Url => "url",
            Self::Email => "email",
            Self::FilePath => "file_path",
            Self::Json => "json",
            Self::Xml => "xml",
            Self::Markdown => "markdown",
            Self::Sql => "sql",
            Self::Shell => "shell",
            Self::Python => "python",
            Self::JavaScript => "javascript",
            Self::Rust => "rust",
            Self::Html => "html",
            Self::Css => "css",
            Self::Git => "git",
            Self::Docker => "docker",
            Self::Phone => "phone",
            Self::PlainText => "plain_text",
        }
    }

    /// Detects the content category from plain text.
    ///
    /// Runs detection functions in priority order. First match wins.
    /// Returns `ContentCategory::PlainText` if no pattern matches.
    pub fn detect(text: &str) -> Self {
        // Detection logic will be implemented in Milestone 1.
        // For now, return PlainText as default.
        let _ = text;
        Self::PlainText
    }
}
