#!/usr/bin/env python3
"""
ORNAS Geometry Refinement — Round 3: Micro-Refinement
=====================================================

Round 2 revealed that compound changes degrade the geometry, meaning the baseline
is already highly optimized. The best single changes were:
  F13  body_radius = 154    (score: 9.170)
  F09  handle_height = 48   (score: 9.149)

In Round 3, we take F13 (radius 154) as the new baseline and attempt micro-adjustments
(±1 or ±2 units) on handle height, bracket height, and overlap. If these fail to beat
F13, then F13 is the mathematical optimum.
"""

from __future__ import annotations

import io
import json
import math
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).parent))
from generator.config import LogoConfig, SCHEME_ACCENT, ColorScheme
from generator.export import svg_to_png_bytes, export_png, export_svg
from generator.logo import OrnasLogo


class Variant(NamedTuple):
    id: str
    label: str
    overrides: dict[str, float]


# New baseline is F13 from Round 2
R2_WINNER_OVERRIDES = {"body_radius_x": 154.0, "body_radius_y": 154.0}
base_dict = asdict(LogoConfig())
base_dict.pop("export_sizes", None)
for k, v in R2_WINNER_OVERRIDES.items():
    base_dict[k] = v
BASELINE = LogoConfig(**base_dict, export_sizes=LogoConfig().export_sizes)


VARIANTS: list[Variant] = [
    # Micro handle height
    Variant("M01", "radius154 + handle H 46", {"handle_height": 46.0}),
    Variant("M02", "radius154 + handle H 47", {"handle_height": 47.0}),
    Variant("M03", "radius154 + handle H 48", {"handle_height": 48.0}),
    Variant("M04", "radius154 + handle H 49", {"handle_height": 49.0}),

    # Micro bracket height
    Variant("M05", "radius154 + bracket H 64", {"bracket_height": 64.0}),
    Variant("M06", "radius154 + bracket H 66", {"bracket_height": 66.0}),
    Variant("M07", "radius154 + bracket H 67", {"bracket_height": 67.0}),

    # Micro overlap
    Variant("M08", "radius154 + overlap 14", {"bracket_overlap": 14.0}),
    Variant("M09", "radius154 + overlap 16", {"bracket_overlap": 16.0}),

    # Micro thickness
    Variant("M10", "radius154 + thickness 53", {"body_thickness": 53.0}),
    Variant("M11", "radius154 + thickness 55", {"body_thickness": 55.0}),
]


def make_config(variant: Variant) -> LogoConfig:
    b = asdict(BASELINE)
    b.pop("export_sizes", None)
    for k, v in variant.overrides.items():
        b[k] = v
    return LogoConfig(**b, export_sizes=BASELINE.export_sizes)


def compute_metrics(logo: OrnasLogo) -> dict[str, float]:
    cfg = logo.config
    canvas_area = cfg.canvas_size ** 2
    combined = unary_union([logo.ring, logo.bracket])

    ring_area = logo.ring.area
    bracket_area = logo.bracket.area
    total_area = combined.area
    minx, miny, maxx, maxy = combined.bounds
    bbox_w = maxx - minx
    bbox_h = maxy - miny
    centroid = combined.centroid

    top_pad = miny
    bottom_pad = cfg.canvas_size - maxy

    return {
        "fill_ratio": round(total_area / canvas_area, 4),
        "rb_ratio": round(ring_area / max(bracket_area, 1), 3),
        "aspect": round(bbox_w / max(bbox_h, 1), 4),
        "v_center": round(centroid.y / cfg.canvas_size, 4),
        "h_offset": round(abs(centroid.x - cfg.canvas_size / 2), 2),
        "ws_ratio": round(min(top_pad, bottom_pad) / max(top_pad, bottom_pad, 1), 4),
        "wall_ratio": round(cfg.body_thickness / max(cfg.body_radius_x, 1), 4),
        "compactness": round(combined.length ** 2 / (4 * math.pi * max(total_area, 1)), 3),
    }


def favicon_clarity(logo: OrnasLogo, size: int = 16) -> float:
    svg_str = logo.to_svg(scheme=SCHEME_ACCENT)
    png_bytes = svg_to_png_bytes(svg_str, size)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    filled = np.sum(alpha > 128)
    edges_h = np.sum(np.abs(np.diff(alpha.astype(float), axis=1)) > 64)
    edges_v = np.sum(np.abs(np.diff(alpha.astype(float), axis=0)) > 64)
    if filled == 0: return 0.0
    return round((edges_h + edges_v) / filled, 4)


def score_variant(metrics: dict[str, float], fav16: float, fav32: float) -> dict[str, float]:
    def gaussian(value: float, ideal: float, sigma: float) -> float:
        deviation = abs(value - ideal) / sigma
        return round(1 + 9 * math.exp(-0.5 * deviation ** 2), 2)

    scores = {
        "silhouette": gaussian(metrics["fill_ratio"], 0.24, 0.04),
        "balance": gaussian(metrics["v_center"], 0.55, 0.04),
        "weight": gaussian(metrics["rb_ratio"], 4.5, 1.5),
        "favicon": gaussian(fav16, 1.85, 0.3),
        "recognizability": gaussian(metrics["aspect"], 0.78, 0.10),
        "uniqueness": gaussian(metrics["wall_ratio"], 0.35, 0.06),
        "premium": gaussian(metrics["ws_ratio"], 0.55, 0.18),
        "desktop": gaussian(metrics["compactness"], 3.5, 1.0),
    }
    weights = {
        "silhouette": 1.2, "balance": 1.1, "weight": 1.0, "favicon": 1.4,
        "recognizability": 1.0, "uniqueness": 0.8, "premium": 0.9, "desktop": 0.6,
    }
    total = sum(weights.values())
    scores["overall"] = round(sum(scores[k] * weights[k] for k in scores) / total, 3)
    return scores


def main() -> None:
    output_dir = Path(__file__).parent / "refinement_output"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ORNAS Geometry Refinement — Round 3: Micro-Refinement")
    print("=" * 60)

    print(f"\n▸ Evaluating new baseline (F13: radius 154)...")
    baseline_logo = OrnasLogo(BASELINE)
    bm = compute_metrics(baseline_logo)
    bf16 = favicon_clarity(baseline_logo, 16)
    bf32 = favicon_clarity(baseline_logo, 32)
    bs = score_variant(bm, bf16, bf32)
    print(f"  Baseline score: {bs['overall']:.3f}")

    baseline_result = {
        "variant": Variant("F13", "radius 154 (unchanged)", {}),
        "config": BASELINE, "logo": baseline_logo, "scores": bs,
    }

    all_results = [baseline_result]

    print(f"\n▸ Generating {len(VARIANTS)} Round 3 variants...")
    for v in VARIANTS:
        cfg = make_config(v)
        logo = OrnasLogo(cfg)
        metrics = compute_metrics(logo)
        f16 = favicon_clarity(logo, 16)
        f32 = favicon_clarity(logo, 32)
        scores = score_variant(metrics, f16, f32)

        all_results.append({
            "variant": v, "config": cfg, "logo": logo, "scores": scores,
        })
        delta = scores["overall"] - bs["overall"]
        marker = "▲" if delta > 0.01 else "▼" if delta < -0.01 else "─"
        print(f"  {v.id:5s}  {v.label:30s}  score={scores['overall']:.3f}  Δ={delta:+.3f} {marker}")

    ranked = sorted(all_results, key=lambda r: r["scores"]["overall"], reverse=True)
    winner = ranked[0]
    wv = winner["variant"]
    ws = winner["scores"]

    print(f"\n{'═' * 60}")
    print(f"  FINAL WINNER: {wv.id} — {wv.label}")
    print(f"  Overall Score: {ws['overall']:.3f}")
    print(f"{'═' * 60}")

    wcfg = winner["config"]
    preset = {
        "name": "ornas_final_geometry",
        "description": f"Optimal geometry: {wv.label} (score {ws['overall']:.3f})",
        "overrides": R2_WINNER_OVERRIDES | wv.overrides,
        "full_config": {
            "canvas_size": wcfg.canvas_size,
            "body_center_y_ratio": wcfg.body_center_y_ratio,
            "body_radius_x": wcfg.body_radius_x,
            "body_radius_y": wcfg.body_radius_y,
            "body_thickness": wcfg.body_thickness,
            "squircle_power": wcfg.squircle_power,
            "bracket_height": wcfg.bracket_height,
            "bracket_overlap": wcfg.bracket_overlap,
            "bracket_leg_thickness": wcfg.bracket_leg_thickness,
            "bracket_corner_radius": wcfg.bracket_corner_radius,
            "handle_width": wcfg.handle_width,
            "handle_height": wcfg.handle_height,
            "handle_corner_radius": wcfg.handle_corner_radius,
            "slot_width": wcfg.slot_width,
            "slot_height": wcfg.slot_height,
            "slot_corner_radius": wcfg.slot_corner_radius,
            "inner_bracket_inset": wcfg.inner_bracket_inset,
            "inner_bracket_corner_radius": wcfg.inner_bracket_corner_radius,
        }
    }
    (output_dir / "ornas_final_preset.json").write_text(json.dumps(preset, indent=2))
    
    # Export final assets
    final_dir = output_dir / "final"
    final_dir.mkdir(parents=True, exist_ok=True)
    for sz in [16, 32, 64, 128, 256, 512]:
        export_png(winner["logo"], final_dir / f"icon-{sz}.png", sz, SCHEME_ACCENT)
    export_svg(winner["logo"], final_dir / "icon.svg", SCHEME_ACCENT)


if __name__ == "__main__":
    main()
