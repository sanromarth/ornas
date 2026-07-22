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
        let t = text.trim();
        if t.is_empty() {
            return Self::PlainText;
        }

        if is_url(t) {
            return Self::Url;
        }
        if is_email(t) {
            return Self::Email;
        }
        if is_file_path(t) {
            return Self::FilePath;
        }
        if is_json(t) {
            return Self::Json;
        }
        if is_xml(t) {
            return Self::Xml;
        }
        if is_markdown(t) {
            return Self::Markdown;
        }
        if is_sql(t) {
            return Self::Sql;
        }
        if is_shell(t) {
            return Self::Shell;
        }
        if is_python(t) {
            return Self::Python;
        }
        if is_javascript(t) {
            return Self::JavaScript;
        }
        if is_rust(t) {
            return Self::Rust;
        }
        if is_html(t) {
            return Self::Html;
        }
        if is_css(t) {
            return Self::Css;
        }
        if is_git(t) {
            return Self::Git;
        }
        if is_docker(t) {
            return Self::Docker;
        }
        if is_phone(t) {
            return Self::Phone;
        }

        Self::PlainText
    }
}

/// Checks if the text is a URL.
pub fn is_url(text: &str) -> bool {
    let t = text.trim();
    if t.contains(char::is_whitespace) {
        return false;
    }
    t.starts_with("http://")
        || t.starts_with("https://")
        || t.starts_with("ftp://")
        || t.starts_with("www.")
}

/// Checks if the text is an email address.
pub fn is_email(text: &str) -> bool {
    let t = text.trim();
    if t.contains(char::is_whitespace) {
        return false;
    }
    if !t.contains('@') || !t.contains('.') {
        return false;
    }
    let parts: Vec<&str> = t.split('@').collect();
    if parts.len() != 2 {
        return false;
    }
    let domain = parts[1];
    domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.')
}

/// Checks if the text is a file path.
pub fn is_file_path(text: &str) -> bool {
    let t = text.trim();
    if t.contains('\n') {
        return false;
    }
    if t.starts_with('/') || t.starts_with("~/") || t.starts_with("./") || t.starts_with("../") {
        return true;
    }
    let bytes = t.as_bytes();
    if bytes.len() >= 3
        && bytes[0].is_ascii_alphabetic()
        && bytes[1] == b':'
        && (bytes[2] == b'\\' || bytes[2] == b'/')
    {
        return true;
    }
    false
}

/// Checks if the text is JSON.
pub fn is_json(text: &str) -> bool {
    let t = text.trim();
    (t.starts_with('{') && t.ends_with('}')) || (t.starts_with('[') && t.ends_with(']'))
}

/// Checks if the text is XML.
///
/// Excludes HTML content (detected separately by `is_html`).
pub fn is_xml(text: &str) -> bool {
    let t = text.trim();
    let lower = t.to_lowercase();
    if !t.starts_with('<') || !t.ends_with('>') || !t.contains("</") {
        return false;
    }
    // Exclude HTML
    let html_tags = [
        "<html",
        "<div",
        "<span",
        "<p ",
        "<p>",
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
    !html_tags.iter().any(|tag| lower.contains(tag))
}

/// Checks if the text is Markdown.
pub fn is_markdown(text: &str) -> bool {
    let has_headers = text
        .lines()
        .any(|l| l.starts_with("# ") || l.starts_with("## "));
    let has_links = text.contains("](") && text.contains('[');
    let has_bold = text.contains("**") || text.contains("__");
    let has_lists = text
        .lines()
        .filter(|l| l.trim_start().starts_with("- ") || l.trim_start().starts_with("* "))
        .count()
        > 1;
    let has_code = text.contains("```");

    // To avoid false positives on simple text
    (has_headers as u8 + has_links as u8 + has_bold as u8 + has_lists as u8 + has_code as u8) >= 2
}

/// Checks if the text is SQL.
pub fn is_sql(text: &str) -> bool {
    let t = text.to_uppercase();
    (t.contains("SELECT ") && t.contains(" FROM "))
        || (t.contains("INSERT INTO ") && t.contains(" VALUES"))
        || (t.contains("UPDATE ") && t.contains(" SET "))
        || (t.contains("DELETE FROM "))
        || (t.contains("CREATE TABLE "))
}

/// Checks if the text is a shell script or command.
pub fn is_shell(text: &str) -> bool {
    let t = text.trim();
    t.starts_with("#!")
        || (t.contains("sudo ")
            || t.contains("apt ")
            || t.contains("npm ")
            || t.contains("git ")
            || t.contains("curl ")
            || t.contains("wget "))
}

/// Checks if the text is Python code.
pub fn is_python(text: &str) -> bool {
    text.contains("def ")
        || text.contains("class ")
        || text.contains("import ")
        || (text.contains("from ") && text.contains(" import "))
        || text.contains("print(")
}

/// Checks if the text is JavaScript/TypeScript code.
pub fn is_javascript(text: &str) -> bool {
    text.contains("const ")
        || text.contains("let ")
        || text.contains("var ")
        || text.contains("function ")
        || text.contains("=>")
        || text.contains("console.log")
}

/// Checks if the text is Rust code.
pub fn is_rust(text: &str) -> bool {
    text.contains("fn ")
        || text.contains("pub fn ")
        || text.contains("impl ")
        || text.contains("struct ")
        || text.contains("enum ")
        || text.contains("use ")
        || text.contains("mod ")
}

/// Checks if the text is HTML.
pub fn is_html(text: &str) -> bool {
    let t = text.to_lowercase();
    t.contains("<html")
        || t.contains("<div")
        || t.contains("<p")
        || t.contains("<span")
        || t.contains("doctype html")
}

/// Checks if the text is CSS.
pub fn is_css(text: &str) -> bool {
    text.contains(" {")
        && text.contains('}')
        && (text.contains("color:")
            || text.contains("display:")
            || text.contains("margin:")
            || text.contains("padding:")
            || text.contains("@media"))
}

/// Checks if the text is Git output or patch.
pub fn is_git(text: &str) -> bool {
    text.contains("diff --git")
        || (text.contains("+++ ") && text.contains("--- "))
        || text.starts_with("commit ")
}

/// Checks if the text is a Dockerfile.
pub fn is_docker(text: &str) -> bool {
    let t = text.to_uppercase();
    t.contains("FROM ")
        && (t.contains("RUN ")
            || t.contains("CMD ")
            || t.contains("COPY ")
            || t.contains("WORKDIR "))
}

/// Checks if the text is a phone number.
pub fn is_phone(text: &str) -> bool {
    let t = text.trim();
    if t.len() < 7 || t.len() > 25 {
        return false;
    }
    let valid_chars = t
        .chars()
        .all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == ' ' || c == '(' || c == ')');
    let has_digits = t.chars().filter(|c| c.is_ascii_digit()).count() >= 7;
    valid_chars && has_digits && !t.contains('\n')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_url() {
        assert!(is_url("https://example.com"));
        assert!(is_url("http://test.org/path"));
        assert!(!is_url("not a url"));
    }

    #[test]
    fn test_is_email() {
        assert!(is_email("test@example.com"));
        assert!(!is_email("test@.com"));
        assert!(!is_email("not-an-email"));
    }

    #[test]
    fn test_is_file_path() {
        assert!(is_file_path("/usr/bin/test"));
        assert!(is_file_path("C:\\Windows\\System32"));
        assert!(is_file_path("~/Documents"));
        assert!(!is_file_path("just some text"));
    }

    #[test]
    fn test_is_json() {
        assert!(is_json("{\"key\": \"value\"}"));
        assert!(is_json("[1, 2, 3]"));
        assert!(!is_json("just text"));
    }

    #[test]
    fn test_is_xml() {
        assert!(is_xml("<note><to>User</to></note>"));
        assert!(!is_xml("<div>html here</div>"));
        assert!(!is_xml("<html><body></body></html>"));
    }

    #[test]
    fn test_is_markdown() {
        assert!(is_markdown("# Header\n## Subheader\n- item 1\n- item 2"));
        assert!(!is_markdown("just some text"));
    }

    #[test]
    fn test_is_sql() {
        assert!(is_sql("SELECT * FROM users"));
        assert!(is_sql("CREATE TABLE test (id INT)"));
    }

    #[test]
    fn test_is_shell() {
        assert!(is_shell("#!/bin/bash"));
        assert!(is_shell("sudo apt update"));
    }

    #[test]
    fn test_is_python() {
        assert!(is_python("def hello():\n    print(\"Hello\")"));
    }

    #[test]
    fn test_is_javascript() {
        assert!(is_javascript("const x = () => 1;"));
    }

    #[test]
    fn test_is_rust() {
        assert!(is_rust("pub fn main() {}"));
    }

    #[test]
    fn test_is_html() {
        assert!(is_html("<html><body>test</body></html>"));
        assert!(is_html("<div class='test'>test</div>"));
    }

    #[test]
    fn test_is_css() {
        assert!(is_css(".class { color: red; }"));
    }

    #[test]
    fn test_is_git() {
        assert!(is_git("diff --git a/file b/file"));
    }

    #[test]
    fn test_is_docker() {
        assert!(is_docker("FROM ubuntu\nRUN echo hi"));
    }

    #[test]
    fn test_is_phone() {
        assert!(is_phone("+1-800-555-0199"));
        assert!(is_phone("(555) 123-4567"));
        assert!(!is_phone("not a phone number"));
    }
}
