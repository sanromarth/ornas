//! Content category enum — database-compatible category identifiers.
//!
//! This module defines the `ContentCategory` enum that maps to the
//! `category` column in the clips table. Detection logic has been
//! moved to the two-stage classification engine in
//! `infrastructure::pipeline::content_classifier` and
//! `infrastructure::pipeline::language_classifier`.

use serde::{Deserialize, Serialize};

/// Content categories stored in the database.
///
/// These values are used as the `category` field in the clips table
/// and correspond to the results of content type classification.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[allow(dead_code)]
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
    Yaml,
    TerminalOutput,
    Diff,
    Log,
    PlainText,
    /// Generic "code" category when language is detected but
    /// no specific ContentCategory variant exists for it.
    Code,
}

#[allow(dead_code)]
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
            Self::Yaml => "yaml",
            Self::TerminalOutput => "terminal_output",
            Self::Diff => "diff",
            Self::Log => "log",
            Self::PlainText => "plain_text",
            Self::Code => "code",
        }
    }

    /// Parse a category string from the database into an enum variant.
    pub fn from_str_lossy(s: &str) -> Self {
        match s {
            "url" => Self::Url,
            "email" => Self::Email,
            "file_path" => Self::FilePath,
            "json" => Self::Json,
            "xml" => Self::Xml,
            "markdown" => Self::Markdown,
            "sql" => Self::Sql,
            "shell" => Self::Shell,
            "python" => Self::Python,
            "javascript" => Self::JavaScript,
            "rust" => Self::Rust,
            "html" => Self::Html,
            "css" => Self::Css,
            "git" => Self::Git,
            "docker" => Self::Docker,
            "phone" => Self::Phone,
            "yaml" => Self::Yaml,
            "terminal_output" => Self::TerminalOutput,
            "diff" => Self::Diff,
            "log" => Self::Log,
            "code" => Self::Code,
            _ => Self::PlainText,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_category_roundtrip() {
        let categories = [
            ContentCategory::Url,
            ContentCategory::Email,
            ContentCategory::PlainText,
            ContentCategory::Json,
            ContentCategory::Markdown,
            ContentCategory::Code,
        ];
        for cat in &categories {
            let s = cat.as_str();
            let parsed = ContentCategory::from_str_lossy(s);
            assert_eq!(&parsed, cat, "roundtrip failed for {}", s);
        }
    }

    #[test]
    fn test_unknown_category_falls_back() {
        assert_eq!(
            ContentCategory::from_str_lossy("unknown"),
            ContentCategory::PlainText
        );
        assert_eq!(
            ContentCategory::from_str_lossy(""),
            ContentCategory::PlainText
        );
    }
}
