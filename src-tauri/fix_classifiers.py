import re

content_file = "src/infrastructure/pipeline/content_classifier.rs"
language_file = "src/infrastructure/pipeline/language_classifier.rs"

def process_detector(code, is_content):
    # Find all impl blocks for ContentDetector and LanguageDetector
    pattern = r'(impl ContentDetector for \w+ \{.*?\n\})' if is_content else r'(impl LanguageDetector for \w+ \{.*?\n\})'
    
    def repl(m):
        block = m.group(1)
        
        # Replace method signature
        if is_content:
            block = block.replace("fn detect(&self, text: &str) -> DetectionSignal {", "fn detect(&self, metrics: &TextMetrics) -> DetectionSignal {")
        else:
            block = block.replace("fn score(&self, text: &str) -> LanguageScore {", "fn score(&self, metrics: &TextMetrics) -> LanguageScore {")

        # Replacements based on user requirements
        # 1. replace `text.trim()` with `metrics.text`
        block = block.replace("text.trim()", "metrics.text")
        
        # 2. replace `text.to_lowercase()` with `&metrics.lower`
        # Actually in some places they assign to `let lower = text.to_lowercase();`
        # If we replace `text.to_lowercase()` with `metrics.lower.clone()` or just `metrics.lower.as_str()`?
        # The user requested `metrics.lower.as_str()` or `&metrics.lower`
        block = block.replace("text.to_lowercase()", "metrics.lower.clone()")
        block = block.replace("text.to_uppercase()", "metrics.upper.clone()")
        
        # 3. replace `text.lines().collect::<Vec<_>>()` or `text.lines().collect()` -> `&metrics.lines` or `metrics.lines.clone()`
        block = block.replace("text.lines().collect()", "metrics.lines.clone()")
        block = block.replace("text.lines().collect::<Vec<_>>()", "metrics.lines.clone()")
        
        # Some use `text.lines()` without collect. If we replace it with `metrics.lines.iter().copied()`, it works for iterator
        # Let's just do `text.lines()` -> `metrics.lines.iter().copied()`? No, it might be safer to do `metrics.lines.iter().copied()`
        # wait, `metrics.lines.iter().copied()` doesn't work if they want a string slice. `metrics.lines` is `Vec<&'a str>`, so `metrics.lines.iter().copied()` gives `&str`.
        # Actually it's easier to just do `metrics.text.lines()`! Wait, `metrics.text` is the trimmed text. 
        block = block.replace("text.lines()", "metrics.text.lines()")
        
        # 4. replace independent `natural_language_ratio(text)` -> `metrics.nl_ratio`
        block = block.replace("natural_language_ratio(text)", "metrics.nl_ratio")
        
        # 5. replace `text.chars().filter(|c| *c == '{').count()` -> `metrics.open_braces`
        block = block.replace("text.chars().filter(|c| *c == '{').count()", "metrics.open_braces")
        block = block.replace("text.chars().filter(|c| *c == '}').count()", "metrics.close_braces")
        
        # 6. For remaining `text.` -> `metrics.text.`
        block = block.replace(" text.", " metrics.text.")
        block = block.replace("(text.", "(metrics.text.")
        block = block.replace("!text.", "!metrics.text.")
        
        # Finally fix any `metrics.metrics.text` if it happened
        block = block.replace("metrics.metrics.", "metrics.")
        
        return block

    return re.sub(pattern, repl, code, flags=re.DOTALL)

with open(content_file, "r") as f:
    content = f.read()

content = process_detector(content, True)
with open(content_file, "w") as f:
    f.write(content)

with open(language_file, "r") as f:
    lang = f.read()

lang = process_detector(lang, False)
with open(language_file, "w") as f:
    f.write(lang)
