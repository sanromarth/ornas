import re

content_file = "src/infrastructure/pipeline/content_classifier.rs"
language_file = "src/infrastructure/pipeline/language_classifier.rs"

with open(content_file, "r") as f:
    cc = f.read()

cc = cc.replace("metrics.metrics.", "metrics.")
cc = cc.replace("metrics.text.lines()\n            .lines()", "metrics.text.lines()")

with open(content_file, "w") as f:
    f.write(cc)


with open(language_file, "r") as f:
    lc = f.read()

lc = lc.replace("metrics.metrics.", "metrics.")
lc = lc.replace("js_detector.score(text)", "js_detector.score(metrics)")
lc = lc.replace("d.score(text)", "d.score(&metrics)")

with open(language_file, "w") as f:
    f.write(lc)

cmd = "src/commands/classification.rs"
with open(cmd, "r") as f:
    ccmd = f.read()

ccmd = ccmd.replace("state.clip_repo()", "state.clip_repo.clone()") # or just `state.clip_repo`
with open(cmd, "w") as f:
    f.write(ccmd)

