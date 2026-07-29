//! Stage 2: Programming Language Classification
//!
//! Only invoked when Stage 1 identifies content as SourceCode with
//! confidence ≥ SOURCE_CODE_GATE_THRESHOLD.
//!
//! Each language detector scores the text using multiple independent
//! structural signals. Single-keyword matches are never sufficient.
//! The natural language ratio further penalizes scores for prose-heavy content.

use crate::domain::classifier::*;

// ═══════════════════════════════════════════════════════════════════════
// Language Classifier (orchestrator)
// ═══════════════════════════════════════════════════════════════════════

/// The Stage 2 classifier. Runs all language detectors and returns the
/// highest-scoring language above the threshold, or None.
pub struct LanguageClassifier {
    detectors: Vec<Box<dyn LanguageDetector>>,
}

impl LanguageClassifier {
    pub fn new() -> Self {
        Self {
            detectors: vec![
                Box::new(RustLangDetector),
                Box::new(PythonLangDetector),
                Box::new(JavaScriptLangDetector),
                Box::new(TypeScriptLangDetector),
                Box::new(SqlLangDetector),
                Box::new(GoLangDetector),
                Box::new(JavaLangDetector),
                Box::new(CLangDetector),
                Box::new(CppLangDetector),
                Box::new(ShellLangDetector),
                Box::new(PhpLangDetector),
            ],
        }
    }

    /// Detect the programming language. Returns None if no language
    /// exceeds the confidence threshold.
    pub fn detect(&self, text: &str) -> Option<LanguageClassification> {
        let metrics = TextMetrics::compute(text);
        let nl_ratio = metrics.nl_ratio;

        let mut scores: Vec<LanguageScore> = self
            .detectors
            .iter()
            .map(|d| {
                let mut s = d.score(&metrics);
                // Apply prose penalty to all language scores.
                // Use a higher threshold (0.55) because structured languages
                // like SQL have lines that superficially resemble prose
                // (uppercase starts, multiple words) but are code.
                if nl_ratio > LANGUAGE_NL_PENALTY_THRESHOLD {
                    let penalty = nl_ratio * LANGUAGE_NL_PENALTY_MULTIPLIER;
                    s.score *= 1.0 - penalty;
                    s.reasons.push(format!(
                        "prose ratio {:.0}% — penalty {:.0}%",
                        nl_ratio * 100.0,
                        penalty * 100.0
                    ));
                }
                s
            })
            .filter(|s| s.score > 0.0)
            .collect();

        scores.sort_by(|a, b| {
            b.score
                .partial_cmp(&a.score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        if scores.is_empty() {
            return None;
        }

        let best = &scores[0];

        if best.score >= LANGUAGE_THRESHOLD {
            if scores.len() > 1 {
                let second = &scores[1];
                let gap = best.score - second.score;
                if gap < CONFIDENCE_GAP_THRESHOLD {
                    tracing::trace!(
                        "Ambiguity detected between {} ({:.2}) and {} ({:.2})",
                        best.language,
                        best.score,
                        second.language,
                        second.score
                    );

                    let langs = (best.language, second.language);
                    let resolved = match langs {
                        ("typescript", "javascript") | ("javascript", "typescript") => {
                            Some("javascript")
                        }
                        ("cpp", "c") | ("c", "cpp") => Some("c"),
                        _ => None, // Unresolvable ambiguity
                    };

                    let resolved_lang = resolved?;
                    let resolved_score = if best.language == resolved_lang {
                        best
                    } else {
                        second
                    };
                    return Some(LanguageClassification {
                        language: resolved_score.language.to_string(),
                        confidence: resolved_score.score.min(1.0),
                        reasoning: resolved_score.reasons.clone(),
                    });
                }
            }

            Some(LanguageClassification {
                language: best.language.to_string(),
                confidence: best.score.min(1.0),
                reasoning: best.reasons.clone(),
            })
        } else {
            None
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Language Detectors
// ═══════════════════════════════════════════════════════════════════════

// ─── Rust ─────────────────────────────────────────────────────────────

struct RustLangDetector;
impl LanguageDetector for RustLangDetector {
    fn name(&self) -> &'static str {
        "rust"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // Strong Rust-specific signals
        if metrics.text.contains("#[derive(") {
            score += 0.40;
            reasons.push("derive macro".into());
        }
        if metrics.text.contains("println!(")
            || metrics.text.contains("eprintln!(")
            || metrics.text.contains("vec![")
        {
            score += 0.35;
            reasons.push("Rust macro invocation".into());
        }
        if metrics.text.contains("let mut ") {
            score += 0.30;
            reasons.push("let mut binding".into());
        }
        if metrics.text.contains("pub fn ")
            || metrics.text.contains("pub struct ")
            || metrics.text.contains("pub enum ")
        {
            score += 0.30;
            reasons.push("pub fn/struct/enum".into());
        }
        if metrics.text.contains("impl ") && metrics.text.contains(" for ") {
            score += 0.35;
            reasons.push("impl Trait for Type".into());
        }
        // Moderate signals (require pairing)
        if metrics.text.contains("fn ")
            && (metrics.text.contains("->") || metrics.text.contains("Result<"))
        {
            score += 0.20;
            reasons.push("fn with return type".into());
        }
        if metrics.text.contains("use crate::") || metrics.text.contains("use std::") {
            score += 0.25;
            reasons.push("Rust use statement".into());
        }
        if metrics.text.contains("unwrap()") || metrics.text.contains(".expect(") {
            score += 0.15;
            reasons.push("unwrap/expect".into());
        }

        LanguageScore {
            language: "rust",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── Python ───────────────────────────────────────────────────────────

struct PythonLangDetector;
impl LanguageDetector for PythonLangDetector {
    fn name(&self) -> &'static str {
        "python"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // Very strong Python signal
        if metrics.text.contains("if __name__ == '__main__':")
            || metrics.text.contains("if __name__ == \"__main__\":")
        {
            score += 0.60;
            reasons.push("__main__ guard".into());
        }

        // Strong signals (require structural context)
        if metrics.text.contains("def ") && metrics.text.contains(":\n") {
            score += 0.30;
            reasons.push("def with colon-newline".into());
        }
        if metrics.text.contains("from ") && metrics.text.contains(" import ") {
            score += 0.25;
            reasons.push("from...import".into());
        }
        if metrics.text.contains("self.") {
            score += 0.15;
            reasons.push("self. reference".into());
        }
        if metrics.text.contains("print(")
            || metrics.text.contains("range(")
            || metrics.text.contains("len(")
        {
            score += 0.15;
            reasons.push("Python builtins".into());
        }
        // Decorators are very Python-specific
        let decorator_count = metrics
            .text
            .lines()
            .filter(|l| l.trim().starts_with('@'))
            .count();
        if decorator_count >= 1 {
            score += 0.20;
            reasons.push(format!("{} decorators", decorator_count));
        }
        // Indentation-based blocks (no braces)
        let has_indent_blocks = metrics.text.contains(":\n    ") || metrics.text.contains(":\n\t");
        let has_no_braces = !metrics.text.contains('{') || metrics.open_braces <= 1;
        if has_indent_blocks && has_no_braces {
            score += 0.15;
            reasons.push("indent-based blocks".into());
        }

        LanguageScore {
            language: "python",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── JavaScript ───────────────────────────────────────────────────────

struct JavaScriptLangDetector;
impl LanguageDetector for JavaScriptLangDetector {
    fn name(&self) -> &'static str {
        "javascript"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // Strong JS-specific signals
        if metrics.text.contains("console.log(") || metrics.text.contains("console.error(") {
            score += 0.30;
            reasons.push("console.log".into());
        }
        if metrics.text.contains("document.getElementById")
            || metrics.text.contains("document.querySelector")
        {
            score += 0.40;
            reasons.push("DOM API".into());
        }
        if metrics.text.contains("export default")
            || metrics.text.contains("export const")
            || metrics.text.contains("module.exports")
        {
            score += 0.30;
            reasons.push("JS module exports".into());
        }
        if metrics.text.contains("require(") && metrics.text.contains("'") {
            score += 0.25;
            reasons.push("CommonJS require".into());
        }
        // Arrow functions with body
        if metrics.text.contains("=> {") || metrics.text.contains("=>\n") {
            score += 0.20;
            reasons.push("arrow function".into());
        }
        // const/let with assignment (not just the word)
        if (metrics.text.contains("const ") || metrics.text.contains("let "))
            && metrics.text.contains(" = ")
            && metrics.text.contains(';')
        {
            score += 0.20;
            reasons.push("const/let assignment".into());
        }
        // function keyword with parens
        if metrics.text.contains("function ")
            && metrics.text.contains("(")
            && metrics.text.contains("{")
        {
            score += 0.20;
            reasons.push("function declaration".into());
        }
        // Penalize TypeScript signals
        if metrics.text.contains("interface ")
            || (metrics.text.contains(": string") || metrics.text.contains(": number"))
        {
            score -= 0.15;
        }

        LanguageScore {
            language: "javascript",
            score: score.clamp(0.0, 1.0),
            reasons,
        }
    }
}

// ─── TypeScript ───────────────────────────────────────────────────────

struct TypeScriptLangDetector;
impl LanguageDetector for TypeScriptLangDetector {
    fn name(&self) -> &'static str {
        "typescript"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        // Start from JS base
        let js_detector = JavaScriptLangDetector;
        let js_score = js_detector.score(metrics);
        let mut score = js_score.score;
        let mut reasons = js_score.reasons;

        // TS-specific signals
        if metrics.text.contains("interface ") && metrics.text.contains("{") {
            score += 0.30;
            reasons.push("interface declaration".into());
        }
        if metrics.text.contains(": string")
            || metrics.text.contains(": number")
            || metrics.text.contains(": boolean")
        {
            score += 0.25;
            reasons.push("type annotations".into());
        }
        if metrics.text.contains("<T>")
            || metrics.text.contains("<T,")
            || metrics.text.contains("Array<")
            || metrics.text.contains("Promise<")
        {
            score += 0.20;
            reasons.push("generics".into());
        }
        if metrics.text.contains("as ")
            && (metrics.text.contains("unknown") || metrics.text.contains("any"))
        {
            score += 0.15;
            reasons.push("type assertion".into());
        }

        LanguageScore {
            language: "typescript",
            score: score.clamp(0.0, 1.0),
            reasons,
        }
    }
}

// ─── SQL (hardened) ───────────────────────────────────────────────────

struct SqlLangDetector;
impl LanguageDetector for SqlLangDetector {
    fn name(&self) -> &'static str {
        "sql"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let upper = &metrics.upper;
        let lines = &metrics.lines;
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // ── Structural clause patterns (require paired keywords) ──

        // SELECT ... FROM with column-like content between them
        if has_sql_select_from(upper) {
            score += 0.40;
            reasons.push("SELECT...FROM clause".into());
        }

        // INSERT INTO ... VALUES
        if upper.contains("INSERT INTO ") && upper.contains(" VALUES") {
            score += 0.35;
            reasons.push("INSERT INTO...VALUES".into());
        }

        // UPDATE ... SET (require table-like identifier after UPDATE)
        if has_sql_update_set(upper) {
            score += 0.35;
            reasons.push("UPDATE...SET clause".into());
        }

        // DELETE FROM (require table identifier after FROM)
        if upper.contains("DELETE FROM ") {
            // Verify it's not just "delete from the list"
            if let Some(pos) = upper.find("DELETE FROM ") {
                let after = &upper[pos + 12..];
                let next_word = after.split_whitespace().next().unwrap_or("");
                // In SQL, the word after DELETE FROM is a table name (no articles)
                let is_article = matches!(
                    next_word,
                    "THE" | "A" | "AN" | "THIS" | "THAT" | "MY" | "OUR" | "YOUR"
                );
                if !is_article {
                    score += 0.30;
                    reasons.push("DELETE FROM table".into());
                }
            }
        }

        // CREATE/ALTER/DROP TABLE
        if upper.contains("CREATE TABLE ")
            || upper.contains("ALTER TABLE ")
            || upper.contains("DROP TABLE ")
        {
            score += 0.40;
            reasons.push("DDL statement".into());
        }

        // ── Supporting signals ────────────────────────────────────

        // Semicolons terminating statements
        let semi_terminated = lines.iter().filter(|l| l.trim().ends_with(';')).count();
        if semi_terminated >= 1 {
            score += 0.10;
            reasons.push(format!("{} semicolon-terminated lines", semi_terminated));
        }

        // SQL-only keywords (extremely unlikely in prose)
        let sql_keywords = [
            "JOIN ",
            "LEFT JOIN",
            "INNER JOIN",
            "RIGHT JOIN",
            "OUTER JOIN",
            "GROUP BY",
            "ORDER BY",
            "HAVING ",
            "LIMIT ",
            "OFFSET ",
            "UNION ",
            "DISTINCT ",
            "CREATE INDEX",
            "DROP INDEX",
            "FOREIGN KEY",
            "PRIMARY KEY",
            "NOT NULL",
            "AUTO_INCREMENT",
            "SERIAL ",
            "VARCHAR",
            "INTEGER",
            "BOOLEAN",
            "TIMESTAMP",
        ];
        let keyword_hits = sql_keywords.iter().filter(|kw| upper.contains(*kw)).count();
        if keyword_hits >= 2 {
            score += 0.25;
            reasons.push(format!("{} SQL-specific keywords", keyword_hits));
        } else if keyword_hits == 1 {
            score += 0.05;
        }

        // SQL comments
        if metrics.text.contains("--") && lines.iter().any(|l| l.trim().starts_with("--")) {
            score += 0.10;
            reasons.push("SQL comments".into());
        }

        // Note: prose penalty is applied uniformly by the LanguageClassifier,
        // so we do NOT apply an additional penalty here. This prevents
        // double-penalization of genuine SQL queries.

        LanguageScore {
            language: "sql",
            score: score.clamp(0.0, 1.0),
            reasons,
        }
    }
}

/// Checks for SELECT ... FROM with column-like content between them.
fn has_sql_select_from(upper: &str) -> bool {
    if let Some(sel_pos) = upper.find("SELECT ") {
        // FROM can be preceded by space or newline in multiline SQL
        let from_offset = upper[sel_pos..]
            .find(" FROM ")
            .or_else(|| upper[sel_pos..].find("\nFROM "));
        if let Some(from_off) = from_offset {
            // Content between SELECT and FROM should look like columns
            let between = &upper[sel_pos + 7..sel_pos + from_off];
            let trimmed = between.trim();
            // Columns are: *, comma-separated identifiers, or short token lists
            let is_column_like =
                trimmed == "*" || trimmed.contains(',') || trimmed.split_whitespace().count() <= 8;
            // Reject if it reads like a natural sentence
            let word_count = trimmed.split_whitespace().count();
            let has_articles = ["THE ", "A ", "AN ", "THIS ", "THAT "]
                .iter()
                .any(|a| trimmed.contains(a));
            if is_column_like && !has_articles && word_count <= 12 {
                return true;
            }
        }
    }
    false
}

/// Checks for UPDATE ... SET with a table identifier pattern.
fn has_sql_update_set(upper: &str) -> bool {
    if let Some(upd_pos) = upper.find("UPDATE ") {
        if let Some(set_offset) = upper[upd_pos..].find(" SET ") {
            let between = &upper[upd_pos + 7..upd_pos + set_offset];
            let word_count = between.split_whitespace().count();
            // Table name is typically 1-3 words (schema.table alias)
            return (1..=3).contains(&word_count);
        }
    }
    false
}

// ─── Go ───────────────────────────────────────────────────────────────

struct GoLangDetector;
impl LanguageDetector for GoLangDetector {
    fn name(&self) -> &'static str {
        "go"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("package main")
            || (metrics.text.contains("package ")
                && metrics
                    .text
                    .lines()
                    .next()
                    .unwrap_or("")
                    .starts_with("package "))
        {
            score += 0.35;
            reasons.push("package declaration".into());
        }
        if metrics.text.contains("func ") && metrics.text.contains("{") {
            score += 0.30;
            reasons.push("func declaration".into());
        }
        if metrics.text.contains("fmt.Println")
            || metrics.text.contains("fmt.Sprintf")
            || metrics.text.contains("fmt.Printf")
        {
            score += 0.35;
            reasons.push("fmt package usage".into());
        }
        if metrics.text.contains("err != nil") || metrics.text.contains("if err != nil") {
            score += 0.40;
            reasons.push("Go error handling pattern".into());
        }
        if metrics.text.contains(":= ") {
            score += 0.20;
            reasons.push("short variable declaration".into());
        }
        if metrics.text.contains("import (")
            || (metrics.text.contains("import \"") && metrics.text.contains("\""))
        {
            score += 0.25;
            reasons.push("Go import".into());
        }

        LanguageScore {
            language: "go",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── Java ─────────────────────────────────────────────────────────────

struct JavaLangDetector;
impl LanguageDetector for JavaLangDetector {
    fn name(&self) -> &'static str {
        "java"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("public static void main(String") {
            score += 0.70;
            reasons.push("main method signature".into());
        }
        if metrics.text.contains("System.out.println")
            || metrics.text.contains("System.err.println")
        {
            score += 0.40;
            reasons.push("System.out.println".into());
        }
        if metrics.text.contains("import java.") || metrics.text.contains("import javax.") {
            score += 0.40;
            reasons.push("Java import".into());
        }
        if metrics.text.contains("public class ") && metrics.text.contains("{") {
            score += 0.30;
            reasons.push("public class declaration".into());
        }
        if metrics.text.contains("@Override")
            || metrics.text.contains("@Autowired")
            || metrics.text.contains("@Controller")
        {
            score += 0.30;
            reasons.push("Java annotations".into());
        }

        LanguageScore {
            language: "java",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── C ────────────────────────────────────────────────────────────────

struct CLangDetector;
impl LanguageDetector for CLangDetector {
    fn name(&self) -> &'static str {
        "c"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("#include <") && metrics.text.contains(".h>") {
            score += 0.40;
            reasons.push("#include header".into());
        }
        if metrics.text.contains("int main(") || metrics.text.contains("void main(") {
            score += 0.30;
            reasons.push("main function".into());
        }
        if metrics.text.contains("printf(")
            || metrics.text.contains("fprintf(")
            || metrics.text.contains("scanf(")
        {
            score += 0.25;
            reasons.push("C standard I/O".into());
        }
        if metrics.text.contains("malloc(")
            || metrics.text.contains("free(")
            || metrics.text.contains("sizeof(")
        {
            score += 0.30;
            reasons.push("C memory management".into());
        }
        // Penalize C++ signals
        if metrics.text.contains("std::")
            || metrics.text.contains("cout")
            || metrics.text.contains("class ")
        {
            score -= 0.30;
        }

        LanguageScore {
            language: "c",
            score: score.clamp(0.0, 1.0),
            reasons,
        }
    }
}

// ─── C++ ──────────────────────────────────────────────────────────────

struct CppLangDetector;
impl LanguageDetector for CppLangDetector {
    fn name(&self) -> &'static str {
        "cpp"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("#include <") {
            score += 0.20;
            reasons.push("#include".into());
        }
        if metrics.text.contains("std::") {
            score += 0.35;
            reasons.push("std:: namespace".into());
        }
        if metrics.text.contains("cout <<") || metrics.text.contains("cin >>") {
            score += 0.35;
            reasons.push("iostream operators".into());
        }
        if metrics.text.contains("vector<")
            || metrics.text.contains("map<")
            || metrics.text.contains("string ")
        {
            score += 0.20;
            reasons.push("STL containers".into());
        }
        if metrics.text.contains("public:")
            || metrics.text.contains("private:")
            || metrics.text.contains("protected:")
        {
            score += 0.25;
            reasons.push("access specifiers".into());
        }
        if metrics.text.contains("nullptr") || metrics.text.contains("auto ") {
            score += 0.15;
            reasons.push("modern C++ keywords".into());
        }

        LanguageScore {
            language: "cpp",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── Shell / Bash ─────────────────────────────────────────────────────

struct ShellLangDetector;
impl LanguageDetector for ShellLangDetector {
    fn name(&self) -> &'static str {
        "bash"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        // Shebang (very strong)
        if metrics.text.starts_with("#!/bin/bash")
            || metrics.text.starts_with("#!/bin/sh")
            || metrics.text.starts_with("#!/usr/bin/env bash")
        {
            score += 0.80;
            reasons.push("shebang".into());
        }

        // Shell-specific syntax
        if metrics.text.contains("if [ ") || metrics.text.contains("if [[ ") {
            score += 0.35;
            reasons.push("shell conditional".into());
        }
        if metrics.text.contains("; then")
            || metrics.text.contains("; do")
            || metrics.text.contains("; fi")
        {
            score += 0.30;
            reasons.push("shell control flow".into());
        }
        if metrics.text.contains("echo ")
            && (metrics.text.contains('$') || metrics.text.contains('"'))
        {
            score += 0.20;
            reasons.push("echo with variables".into());
        }
        if metrics.text.contains("export ") && metrics.text.contains('=') {
            score += 0.20;
            reasons.push("export assignment".into());
        }
        // Variable expansion
        let var_count = metrics.text.matches("${").count() + metrics.text.matches("$(").count();
        if var_count >= 2 {
            score += 0.25;
            reasons.push(format!("{} variable expansions", var_count));
        }

        LanguageScore {
            language: "bash",
            score: score.min(1.0),
            reasons,
        }
    }
}

// ─── PHP ──────────────────────────────────────────────────────────────

struct PhpLangDetector;
impl LanguageDetector for PhpLangDetector {
    fn name(&self) -> &'static str {
        "php"
    }
    fn score(&self, metrics: &TextMetrics) -> LanguageScore {
        let mut score = 0.0_f64;
        let mut reasons = Vec::new();

        if metrics.text.contains("<?php") {
            score += 0.80;
            reasons.push("PHP opening tag".into());
        }
        if metrics.text.contains("echo $") || metrics.text.contains("print $") {
            score += 0.30;
            reasons.push("echo/print variable".into());
        }
        if metrics.text.contains("public function") || metrics.text.contains("private function") {
            score += 0.25;
            reasons.push("PHP method".into());
        }
        if metrics.text.contains("->") && metrics.text.contains('$') {
            score += 0.20;
            reasons.push("PHP object operator".into());
        }
        if metrics.text.contains("namespace ") && metrics.text.contains(';') {
            score += 0.20;
            reasons.push("PHP namespace".into());
        }

        LanguageScore {
            language: "php",
            score: score.min(1.0),
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

    fn classifier() -> LanguageClassifier {
        LanguageClassifier::new()
    }

    // ── True positives ────────────────────────────────────────

    #[test]
    fn test_detect_rust() {
        let c = classifier();
        let text = "use std::io;\n\nfn main() {\n    let mut input = String::new();\n    println!(\"Enter name:\");\n}";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect Rust");
        assert_eq!(result.unwrap().language, "rust");
    }

    #[test]
    fn test_detect_python() {
        let c = classifier();
        let text = "import os\nfrom pathlib import Path\n\ndef process(items):\n    for item in items:\n        print(item)\n\nif __name__ == '__main__':\n    process([1, 2, 3])";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect Python");
        assert_eq!(result.unwrap().language, "python");
    }

    #[test]
    fn test_detect_sql() {
        let c = classifier();
        let text = "SELECT u.id, u.name, u.email\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1\nORDER BY u.name;";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect SQL");
        assert_eq!(result.unwrap().language, "sql");
    }

    #[test]
    fn test_detect_go() {
        let c = classifier();
        let text = "package main\n\nimport \"fmt\"\n\nfunc main() {\n    result, err := compute(42)\n    if err != nil {\n        fmt.Println(err)\n    }\n}";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect Go");
        assert_eq!(result.unwrap().language, "go");
    }

    #[test]
    fn test_detect_javascript() {
        let c = classifier();
        let text = "export const handler = async (req, res) => {\n    const data = await fetch('/api');\n    console.log(data);\n    return res.json({ ok: true });\n};";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect JavaScript");
        assert_eq!(result.unwrap().language, "javascript");
    }

    #[test]
    fn test_detect_shell() {
        let c = classifier();
        let text = "#!/bin/bash\nset -euo pipefail\n\nfor file in *.txt; do\n    echo \"Processing ${file}\"\ndone";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect Bash");
        assert_eq!(result.unwrap().language, "bash");
    }

    // ── False positive prevention ─────────────────────────────

    #[test]
    fn test_meeting_notes_not_sql() {
        let c = classifier();
        let text = "Meeting Notes 2026-07-28\n\
                     - Select the items from the backlog for the next sprint\n\
                     - Delete old branches after the code review is complete\n\
                     - Update the project status page with the latest numbers\n\
                     - Insert the new team members into the org chart";
        let result = c.detect(text);
        assert!(
            result.is_none() || result.as_ref().unwrap().language != "sql",
            "Meeting notes must NOT be classified as SQL, got: {:?}",
            result
        );
    }

    #[test]
    fn test_architecture_doc_not_code() {
        let c = classifier();
        let text = "The system architecture follows clean architecture principles.\n\
                     We use a layered approach with domain, application, and infrastructure layers.\n\
                     The import of external dependencies should be minimized.\n\
                     Each class should have a single responsibility.\n\
                     Let us define the module boundaries clearly.";
        let result = c.detect(text);
        assert!(
            result.is_none(),
            "Architecture prose must NOT be classified as any language, got: {:?}",
            result
        );
    }

    #[test]
    fn test_shopping_list_not_code() {
        let c = classifier();
        let text =
            "Shopping List\n- Bread\n- Milk\n- Const brand cereal\n- Let tuce\n- Orange juice";
        let result = c.detect(text);
        assert!(
            result.is_none(),
            "Shopping list must NOT be classified as code, got: {:?}",
            result
        );
    }

    #[test]
    fn test_email_draft_not_code() {
        let c = classifier();
        let text = "Hi Team,\n\nPlease select the reports from last quarter.\n\
                     We need to update the documentation and delete the outdated entries.\n\
                     Let me know if you have any questions.\n\nBest regards,\nJane";
        let result = c.detect(text);
        assert!(
            result.is_none(),
            "Email draft must NOT be classified as code, got: {:?}",
            result
        );
    }

    #[test]
    fn test_single_sql_keyword_not_sql() {
        let c = classifier();
        // Just the word "Select" or "Delete" should never trigger SQL
        let result1 = c.detect("Select");
        assert!(result1.is_none() || result1.as_ref().unwrap().language != "sql");
        let result2 = c.detect("Delete the old records from the archive.");
        assert!(result2.is_none() || result2.as_ref().unwrap().language != "sql");
    }

    #[test]
    fn test_actual_sql_create_table() {
        let c = classifier();
        let text = "CREATE TABLE users (\n    id INTEGER PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(255) NOT NULL,\n    email VARCHAR(255) UNIQUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);";
        let result = c.detect(text);
        assert!(result.is_some(), "CREATE TABLE should be detected as SQL");
        assert_eq!(result.unwrap().language, "sql");
    }

    // Very small code snippets
    #[test]
    fn test_one_line_not_enough() {
        let c = classifier();
        // A single line of code-like text should not be confidently classified
        let r = c.detect("let x = 42;");
        // This could be JS, TS, or Rust - ambiguous, so None is acceptable
        // The point is it should not confidently pick the wrong language
        // If it returns Some, the confidence should be genuine
        if let Some(lang) = &r {
            assert!(
                lang.confidence >= 0.50,
                "Single line should have real confidence if detected"
            );
        }
    }

    // TypeScript detection
    #[test]
    fn test_detect_typescript() {
        let c = classifier();
        let text = "interface User {\n  id: number;\n  name: string;\n}\n\nexport const getUser = async (id: number): Promise<User> => {\n  const response = await fetch(`/api/users/${id}`);\n  return response.json();\n};";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect TypeScript");
        assert_eq!(result.unwrap().language, "typescript");
    }

    // Java detection
    #[test]
    fn test_detect_java() {
        let c = classifier();
        let text = "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> items = new ArrayList<>();\n        System.out.println(items.size());\n    }\n}";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect Java");
        assert_eq!(result.unwrap().language, "java");
    }

    // C++ detection
    #[test]
    fn test_detect_cpp() {
        let c = classifier();
        let text = "#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> nums = {1, 2, 3};\n    for (auto& n : nums) {\n        std::cout << n << std::endl;\n    }\n    return 0;\n}";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect C++");
        assert_eq!(result.unwrap().language, "cpp");
    }

    // PHP detection
    #[test]
    fn test_detect_php() {
        let c = classifier();
        let text = "<?php\nnamespace App\\Controllers;\n\nclass UserController {\n    public function index() {\n        $users = User::all();\n        echo $users;\n    }\n}";
        let result = c.detect(text);
        assert!(result.is_some(), "Should detect PHP");
        assert_eq!(result.unwrap().language, "php");
    }

    // Mixed HTML+JS should not be detected as a programming language
    // (it's HTML, not source code, at the Stage 1 level)
    #[test]
    fn test_html_with_script_not_code() {
        let c = classifier();
        // This is HTML with embedded JS — Stage 1 should classify as HTML,
        // so Stage 2 shouldn't even run. But if it does, test resilience.
        let text =
            "<html><body><script>console.log('hello');</script><div>Content</div></body></html>";
        // Stage 2 alone should not confidently detect JS from this mixed content
        let result = c.detect(text);
        // Either None or low-confidence is acceptable
        if let Some(lang) = &result {
            assert!(
                lang.confidence < 0.80,
                "Mixed HTML+JS should not be high confidence"
            );
        }
    }

    // Regression: prose with SQL keywords must NEVER return sql
    #[test]
    fn test_project_plan_not_sql() {
        let c = classifier();
        let text = "Project Plan Q3 2026\n\n\
        Phase 1: Select the framework for the new microservice\n\
        Phase 2: Update the existing database schema\n\
        Phase 3: Delete deprecated API endpoints\n\
        Phase 4: Insert monitoring and alerting\n\
        Phase 5: Join the frontend and backend teams for integration\n\
        Phase 6: Create the deployment pipeline\n\
        Phase 7: Drop support for legacy clients";
        let result = c.detect(text);
        assert!(
            result.is_none() || result.as_ref().unwrap().language != "sql",
            "Project plan must NOT be classified as SQL, got: {:?}",
            result
        );
    }
}
