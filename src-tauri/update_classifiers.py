import re

content_file = "src/infrastructure/pipeline/content_classifier.rs"
language_file = "src/infrastructure/pipeline/language_classifier.rs"

def process_file(path, is_content):
    with open(path, "r") as f:
        code = f.read()
    
    if is_content:
        code = code.replace("fn detect(&self, text: &str) -> DetectionSignal {", "fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {")
    else:
        code = code.replace("fn score(&self, text: &str) -> LanguageScore {", "fn score(&self, metrics: &TextMetrics) -> LanguageScore {")

    # We want to replace `text.foo` with `metrics.text.foo` inside the file, but we should exclude the `classify` and `detect` orchestrator methods.
    # To do this safely, we will just replace the specific text manipulations that appear in the detectors.
    code = code.replace("text.trim()", "metrics.text")
    code = code.replace("text.to_lowercase()", "metrics.lower.clone()")
    code = code.replace("text.to_uppercase()", "metrics.upper.clone()")
    code = code.replace("text.lines().collect::<Vec<_>>()", "metrics.lines.clone()")
    code = code.replace("text.lines().collect()", "metrics.lines.clone()")
    code = code.replace("text.lines()", "metrics.text.lines()")
    code = code.replace("natural_language_ratio(text)", "metrics.nl_ratio")
    code = code.replace("text.chars().filter(|c| *c == '{').count()", "metrics.open_braces")
    code = code.replace("text.chars().filter(|c| *c == '}').count()", "metrics.close_braces")

    # Remaining `text.` replacements
    code = code.replace(" text.", " metrics.text.")
    code = code.replace("(text.", "(metrics.text.")
    code = code.replace("!text.", "!metrics.text.")

    # Fix tests and orchestrators where `text` is still meant to be used
    if is_content:
        # Revert inside classify()
        code = code.replace("pub fn classify(&self, metrics.text: &str)", "pub fn classify(&self, text: &str)")
        code = code.replace("let trimmed = metrics.text.trim();", "let trimmed = text.trim();")
        code = code.replace("metrics.text.trim().is_empty()", "text.trim().is_empty()")
        code = code.replace("natural_language_ratio(trimmed)", "natural_language_ratio(trimmed)")
        
        # Test fixes
        code = code.replace("c.classify(metrics.text)", "c.classify(text)")
    else:
        # Revert inside detect()
        code = code.replace("pub fn detect(&self, metrics.text: &str)", "pub fn detect(&self, text: &str)")
        code = code.replace("natural_language_ratio(metrics.text)", "natural_language_ratio(text)")
        # js_detector
        code = code.replace("js_detector.score(metrics.text)", "js_detector.score(metrics)")

    with open(path, "w") as f:
        f.write(code)

process_file(content_file, True)
process_file(language_file, False)
