import os
import re

files_to_check = [
    "docs/ARCHITECTURE_FINAL.md",
    "docs/archive/pipeline/ARCHITECTURE_REFINEMENT.md",
    "docs/archive/pipeline/EVENT_MODEL.md",
    "docs/archive/pipeline/IMAGE_WORKER_DESIGN.md",
    "docs/archive/pipeline/JOB_QUEUE_DESIGN.md",
    "docs/archive/pipeline/PERFORMANCE_REPORT.md",
    "docs/archive/pipeline/PIPELINE_DISPATCHER_DESIGN.md",
    "docs/archive/pipeline/THREADING_MODEL.md",
    "docs/archive/research/FINAL_ENGINEERING_REVIEW.md",
    "docs/archive/research/FUTURE_ROADMAP.md",
    "docs/archive/research/RISK_ANALYSIS.md",
    "docs/archive/wayland/FINAL_WAYLAND_ENGINEERING_REVIEW.md",
    "docs/archive/wayland/WAYLAND_ARCHITECTURE_REVIEW.md",
    "docs/archive/wayland/WAYLAND_BASELINE.md",
    "docs/archive/wayland/WAYLAND_BLOCKING_ANALYSIS.md",
    "docs/archive/wayland/WAYLAND_CODE_REVIEW.md",
    "docs/archive/wayland/WAYLAND_COMPATIBILITY_MATRIX.md",
    "docs/archive/wayland/WAYLAND_DECISION_MATRIX.md",
    "docs/archive/wayland/WAYLAND_RECOMMENDATION.md",
    "docs/archive/wayland/WAYLAND_REGRESSION_REPORT.md"
]

for filepath in files_to_check:
    full_path = os.path.join("/home/sanro/ORNAS", filepath)
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We want to replace specific patterns.
    # Replace 'ORNAS V2' -> 'ORNAS'
    content = re.sub(r'ORNAS V2\+?', 'ORNAS', content)
    # Replace 'Clipboard Engine V2' -> 'Clipboard Engine'
    content = re.sub(r'Clipboard Engine V2', 'Clipboard Engine', content)
    # Replace 'Pipeline V2' -> 'Pipeline'
    content = re.sub(r'Pipeline V2', 'Pipeline', content)
    # Replace 'Roadmap V2' -> 'Roadmap'
    content = re.sub(r'Roadmap V2', 'Roadmap', content)
    # Replace 'V2 Event Bus' -> 'Event Bus'
    content = re.sub(r'V2 Event Bus', 'Event Bus', content)
    # 'Final V2+ Roadmap' -> 'Final Roadmap'
    content = re.sub(r'Final V2\+ Roadmap', 'Final Roadmap', content)
    # 'V2 needs multiple subscribers' -> 'the system needs multiple subscribers'
    content = re.sub(r'When V2 needs', 'When the system needs', content)
    # Other loose ' V2' that might just be after ORNAS or standalone but not 'Tauri v2'
    # Actually, replacing ORNAS V2 caught most of them. Let's see if any " V2" remains.
    
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Done replacing V2 references.")
