import os
import re

content_file = "/home/sanro/ORNAS/src-tauri/src/infrastructure/pipeline/content_classifier.rs"
language_file = "/home/sanro/ORNAS/src-tauri/src/infrastructure/pipeline/language_classifier.rs"

def process_file(path, is_content):
    with open(path, "r") as f:
        content = f.read()

    # 1. Update trait method signatures
    if is_content:
        content = re.sub(r"fn detect\(&self, text: &str\) -> DetectionSignal \{", 
                         r"fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {", 
                         content)
    else:
        content = re.sub(r"fn score\(&self, text: &str\) -> LanguageScore \{", 
                         r"fn score(&self, metrics: &TextMetrics) -> LanguageScore {", 
                         content)

    # 2. Replace uses of `text` with `metrics` where appropriate in detector impls.
    # Note: We only want to replace `text` usages INSIDE the detector methods.
    # We can do some brute force replacements, since `text` isn't used much outside,
    # except in tests, where it will remain `text: &str`.
    # Actually, in tests they call `c.classify("...")`, which is fine.
    
    # Let's replace common patterns inside the detectors:
    content = content.replace("text.trim()", "metrics.text")
    content = content.replace("text.to_lowercase()", "metrics.lower.clone()") # wait, better to borrow
    # Actually, the user asked to replace:
    # `text.to_lowercase()` -> `metrics.lower.as_str()` or `&metrics.lower`
    # `text.to_uppercase()` -> `metrics.upper.as_str()` or `&metrics.upper`
    # `text.lines().collect::<Vec<_>>()` -> `&metrics.lines` or `metrics.lines.clone()`
    
    # We will do regex replacements for the specific method bodies.
    # It's easier to find the block of each detector.
    
    # But wait, replacing `text.` with `metrics.text.` might work.
    content = content.replace("text.trim()", "metrics.text")
    content = content.replace("text.to_lowercase()", "metrics.lower.clone()") 
    content = content.replace("text.to_uppercase()", "metrics.upper.clone()") 
    content = content.replace("text.lines().collect()", "metrics.lines.clone()")
    content = content.replace("text.lines()", "metrics.lines.iter().copied()") # since it's Vec<&str>
    
    content = content.replace("text.chars()", "metrics.text.chars()")
    content = content.replace("text.len()", "metrics.text.len()")
    content = content.replace("text.as_bytes()", "metrics.text.as_bytes()")
    content = content.replace("text.contains(", "metrics.text.contains(")
    content = content.replace("text.starts_with(", "metrics.text.starts_with(")
    content = content.replace("text.ends_with(", "metrics.text.ends_with(")
    content = content.replace("text.matches(", "metrics.text.matches(")

    with open(path, "w") as f:
        f.write(content)

process_file(content_file, True)
process_file(language_file, False)
