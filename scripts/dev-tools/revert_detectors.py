import os

content_file = "/home/sanro/ORNAS/src-tauri/src/infrastructure/pipeline/content_classifier.rs"
language_file = "/home/sanro/ORNAS/src-tauri/src/infrastructure/pipeline/language_classifier.rs"

def revert_file(path, is_content):
    with open(path, "r") as f:
        content = f.read()

    # Revert trait method signatures
    if is_content:
        content = content.replace("fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {",
                                  "fn detect(&self, text: &str) -> DetectionSignal {")
    else:
        content = content.replace("fn score(&self, metrics: &TextMetrics) -> LanguageScore {",
                                  "fn score(&self, text: &str) -> LanguageScore {")

    # Revert common patterns (in reverse order)
    content = content.replace("metrics.text.matches(", "text.matches(")
    content = content.replace("metrics.text.ends_with(", "text.ends_with(")
    content = content.replace("metrics.text.starts_with(", "text.starts_with(")
    content = content.replace("metrics.text.contains(", "text.contains(")
    content = content.replace("metrics.text.as_bytes()", "text.as_bytes()")
    content = content.replace("metrics.text.len()", "text.len()")
    content = content.replace("metrics.text.chars()", "text.chars()")
    content = content.replace("metrics.lines.iter().copied()", "text.lines()")
    content = content.replace("metrics.lines.clone()", "text.lines().collect()")
    content = content.replace("metrics.upper.clone()", "text.to_uppercase()")
    content = content.replace("metrics.lower.clone()", "text.to_lowercase()")
    content = content.replace("metrics.text", "text.trim()")

    with open(path, "w") as f:
        f.write(content)

revert_file(content_file, True)
revert_file(language_file, False)
