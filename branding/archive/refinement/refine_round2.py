#!/usr/bin/env python3
"""
ORNAS Geometry Refinement — Round 2: Compound Optimization
=============================================================

Round 1 identified the top single-parameter improvements:
  BO01  bracket_overlap=10    (+0.05)
  BH03  bracket_height=70     (+0.04)
  HH03  handle_height=48      (+0.03)
  R02   body_radius=152       (+0.02)

Round 2:
  1. Recalibrate the scoring function using actual metric distributions.
  2. Generate compound variants combining 2–3 of the winners.
  3. Select the final optimal geometry.
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
from generator.config import LogoConfig, SCHEME_ACCENT, SCHEME_LIGHT, SCHEME_DARK, ColorScheme
from generator.export import svg_to_png_bytes, export_png, export_svg
from generator.logo import OrnasLogo


class Variant(NamedTuple):
    id: str
    label: str
    overrides: dict[str, float]


BASELINE = LogoConfig()

# ── Round 2 Variants ──────────────────────────────────────────────────────
# Single-param refinements around the Round 1 winners, plus compound combos

VARIANTS: list[Variant] = [
    # Fine-tune overlap (winner area: 10)
    Variant("F01", "overlap 8", {"bracket_overlap": 8.0}),
    Variant("F02", "overlap 9", {"bracket_overlap": 9.0}),
    Variant("F03", "overlap 10", {"bracket_overlap": 10.0}),
    Variant("F04", "overlap 11", {"bracket_overlap": 11.0}),

    # Fine-tune bracket height (winner area: 70)
    Variant("F05", "bracket H 68", {"bracket_height": 68.0}),
    Variant("F06", "bracket H 70", {"bracket_height": 70.0}),
    Variant("F07", "bracket H 72", {"bracket_height": 72.0}),

    # Fine-tune handle height (winner area: 48)
    Variant("F08", "handle H 46", {"handle_height": 46.0}),
    Variant("F09", "handle H 48", {"handle_height": 48.0}),
    Variant("F10", "handle H 50", {"handle_height": 50.0}),

    # Fine-tune radius (winner area: 152)
    Variant("F11", "radius 150", {"body_radius_x": 150.0, "body_radius_y": 150.0}),
    Variant("F12", "radius 152", {"body_radius_x": 152.0, "body_radius_y": 152.0}),
    Variant("F13", "radius 154", {"body_radius_x": 154.0, "body_radius_y": 154.0}),

    # ── Compound: 2-param combos ──────────────────────────────────────
    Variant("C01", "overlap10 + bracket70",
            {"bracket_overlap": 10.0, "bracket_height": 70.0}),
    Variant("C02", "overlap10 + handle48",
            {"bracket_overlap": 10.0, "handle_height": 48.0}),
    Variant("C03", "overlap10 + radius152",
            {"bracket_overlap": 10.0, "body_radius_x": 152.0, "body_radius_y": 152.0}),
    Variant("C04", "bracket70 + handle48",
            {"bracket_height": 70.0, "handle_height": 48.0}),
    Variant("C05", "bracket70 + radius152",
            {"bracket_height": 70.0, "body_radius_x": 152.0, "body_radius_y": 152.0}),
    Variant("C06", "handle48 + radius152",
            {"handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0}),

    # ── Compound: 3-param combos ──────────────────────────────────────
    Variant("C07", "ovlp10+brk70+hndl48",
            {"bracket_overlap": 10.0, "bracket_height": 70.0, "handle_height": 48.0}),
    Variant("C08", "ovlp10+brk70+rad152",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "body_radius_x": 152.0, "body_radius_y": 152.0}),
    Variant("C09", "ovlp10+hndl48+rad152",
            {"bracket_overlap": 10.0, "handle_height": 48.0,
             "body_radius_x": 152.0, "body_radius_y": 152.0}),
    Variant("C10", "brk70+hndl48+rad152",
            {"bracket_height": 70.0, "handle_height": 48.0,
             "body_radius_x": 152.0, "body_radius_y": 152.0}),

    # ── Compound: 4-param (all winners) ───────────────────────────────
    Variant("C11", "ALL: ovlp10+brk70+hndl48+rad152",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0,
             "body_radius_x": 152.0, "body_radius_y": 152.0}),

    # ── Extra micro-adjustments around best compound ──────────────────
    Variant("M01", "ALL + thickness 52",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "body_thickness": 52.0}),
    Variant("M02", "ALL + thickness 56",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "body_thickness": 56.0}),
    Variant("M03", "ALL + power 4.5",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "squircle_power": 4.5}),
    Variant("M04", "ALL + power 3.8",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "squircle_power": 3.8}),
    Variant("M05", "ALL + bracket_r 17",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "bracket_corner_radius": 17.0}),
    Variant("M06", "ALL + handle_w 94",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "handle_width": 94.0}),
    Variant("M07", "ALL + slot_w 44",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "slot_width": 44.0}),
    Variant("M08", "ALL + leg 24",
            {"bracket_overlap": 10.0, "bracket_height": 70.0,
             "handle_height": 48.0, "body_radius_x": 152.0, "body_radius_y": 152.0,
             "bracket_leg_thickness": 24.0}),
]


# ═══════════════════════════════════════════════════════════════════════════
# Metrics
# ═══════════════════════════════════════════════════════════════════════════

def make_config(variant: Variant) -> LogoConfig:
    base = asdict(BASELINE)
    base.pop("export_sizes", None)
    for k, v in variant.overrides.items():
        base[k] = v
    return LogoConfig(**base, export_sizes=BASELINE.export_sizes)


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
        "ring_area": round(ring_area, 1),
        "bracket_area": round(bracket_area, 1),
        "total_area": round(total_area, 1),
        "top_pad": round(top_pad, 1),
        "bottom_pad": round(bottom_pad, 1),
        "bbox_aspect": round(bbox_w / max(bbox_h, 1), 3),
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
    if filled == 0:
        return 0.0
    return round((edges_h + edges_v) / filled, 4)


def score_variant(metrics: dict[str, float], fav16: float, fav32: float) -> dict[str, float]:
    """Recalibrated scoring using actual metric distributions from Round 1."""

    def gaussian(value: float, ideal: float, sigma: float) -> float:
        deviation = abs(value - ideal) / sigma
        return round(1 + 9 * math.exp(-0.5 * deviation ** 2), 2)

    scores = {}

    # Silhouette: fill ~0.24 (measured baseline: 0.2392)
    scores["silhouette"] = gaussian(metrics["fill_ratio"], 0.24, 0.04)

    # Balance: v_center ~0.55
    scores["balance"] = gaussian(metrics["v_center"], 0.55, 0.04)

    # Weight: ring/bracket ratio ~4.5
    scores["weight"] = gaussian(metrics["rb_ratio"], 4.5, 1.5)

    # Favicon: recalibrated — actual fav16 values are 1.5–2.1
    #          Higher edge density = more detail preserved
    #          Ideal around 1.85 (good detail without noise)
    scores["favicon"] = gaussian(fav16, 1.85, 0.3)

    # Recognizability: aspect ~0.78
    scores["recognizability"] = gaussian(metrics["aspect"], 0.78, 0.10)

    # Uniqueness: wall ratio ~0.35
    scores["uniqueness"] = gaussian(metrics["wall_ratio"], 0.35, 0.06)

    # Premium: whitespace balance ~0.55 (slightly more top padding)
    scores["premium"] = gaussian(metrics["ws_ratio"], 0.55, 0.18)

    # Desktop: compactness ~3.5
    scores["desktop"] = gaussian(metrics["compactness"], 3.5, 1.0)

    weights = {
        "silhouette": 1.2,
        "balance": 1.1,
        "weight": 1.0,
        "favicon": 1.4,
        "recognizability": 1.0,
        "uniqueness": 0.8,
        "premium": 0.9,
        "desktop": 0.6,
    }
    total = sum(weights.values())
    scores["overall"] = round(sum(scores[k] * weights[k] for k in scores) / total, 3)
    return scores


# ═══════════════════════════════════════════════════════════════════════════
# Rendering
# ═══════════════════════════════════════════════════════════════════════════

def render_logo(logo: OrnasLogo, size: int, scheme=SCHEME_ACCENT) -> Image.Image:
    svg_str = logo.to_svg(scheme=scheme)
    png_bytes = svg_to_png_bytes(svg_str, size)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


def load_font(size: int = 12):
    for name in ("DejaVuSans", "FreeSans", "Arial"):
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def make_finalist_comparison(
    finalists: list[dict[str, Any]],
    output_path: Path,
) -> Path:
    """Detailed multi-size comparison of the top candidates."""
    n = len(finalists)
    sizes = [16, 24, 32, 48, 64, 128]
    col_w = 360
    total_w = n * col_w
    total_h = 520

    bg = (13, 13, 26, 255)
    canvas = Image.new("RGBA", (total_w, total_h), bg)
    draw = ImageDraw.Draw(canvas)
    font = load_font(13)
    font_sm = load_font(10)
    font_lg = load_font(16)

    for i, f in enumerate(finalists):
        x = i * col_w
        v = f["variant"]
        s = f["scores"]

        # Border for winner
        if i == 0:
            draw.rectangle([(x+2, 2), (x+col_w-3, total_h-3)],
                           outline=(0, 212, 255, 120), width=2)

        # Title
        draw.text((x+12, 10), f"#{i+1}  {v.id}", fill=(255, 255, 255, 240), font=font_lg)
        draw.text((x+12, 32), v.label, fill=(200, 200, 220, 200), font=font)
        draw.text((x+12, 50), f"Score: {s['overall']:.3f}", fill=(0, 212, 255, 220), font=font)

        # Score breakdown
        y_score = 72
        for cat in ["silhouette", "balance", "weight", "favicon",
                     "recognizability", "uniqueness", "premium", "desktop"]:
            val = s[cat]
            bar_w = int(val * 18)
            color = (0, 212, 255, 180) if val >= 8.0 else (180, 180, 200, 150)
            draw.rectangle([(x+12, y_score), (x+12+bar_w, y_score+8)], fill=color)
            draw.text((x+200, y_score-2), f"{cat[:8]:8s} {val:.1f}", fill=(180, 180, 200, 160), font=font_sm)
            y_score += 14

        # Multi-size strip
        sx = x + 12
        sy = 200
        for sz in sizes:
            img = render_logo(f["logo"], sz)
            y_pos = sy + (128 - sz)
            canvas.paste(img, (sx, y_pos), mask=img)
            draw.text((sx, sy + 132), f"{sz}", fill=(120, 120, 140, 150), font=font_sm)
            sx += sz + 8

        # Large preview
        big = render_logo(f["logo"], 180)
        canvas.paste(big, (x + 90, 340), mask=big)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    output_dir = Path(__file__).parent / "refinement_output"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ORNAS Geometry Refinement — Round 2: Compound Optimization")
    print("=" * 60)

    # Baseline
    print(f"\n▸ Evaluating baseline...")
    baseline_logo = OrnasLogo(BASELINE)
    bm = compute_metrics(baseline_logo)
    bf16 = favicon_clarity(baseline_logo, 16)
    bf32 = favicon_clarity(baseline_logo, 32)
    bs = score_variant(bm, bf16, bf32)
    print(f"  Baseline score: {bs['overall']:.3f}")
    print(f"  fav16={bf16:.4f}  fav32={bf32:.4f}")

    baseline_result = {
        "variant": Variant("BASE", "baseline (unchanged)", {}),
        "config": BASELINE, "logo": baseline_logo,
        "metrics": bm, "fav16": bf16, "fav32": bf32, "scores": bs,
    }

    # Generate all variants
    print(f"\n▸ Generating {len(VARIANTS)} Round 2 variants...")
    all_results = [baseline_result]

    for v in VARIANTS:
        try:
            cfg = make_config(v)
            logo = OrnasLogo(cfg)
            metrics = compute_metrics(logo)
            f16 = favicon_clarity(logo, 16)
            f32 = favicon_clarity(logo, 32)
            scores = score_variant(metrics, f16, f32)

            all_results.append({
                "variant": v, "config": cfg, "logo": logo,
                "metrics": metrics, "fav16": f16, "fav32": f32, "scores": scores,
            })

            delta = scores["overall"] - bs["overall"]
            marker = "▲" if delta > 0.05 else "▼" if delta < -0.05 else "─"
            print(f"  {v.id:5s}  {v.label:35s}  score={scores['overall']:.3f}  Δ={delta:+.3f} {marker}")

        except Exception as e:
            print(f"  {v.id:5s}  {v.label:35s}  FAILED: {e}")

    # Rank
    ranked = sorted(all_results, key=lambda r: r["scores"]["overall"], reverse=True)

    # Top 5
    finalists = ranked[:5]
    print(f"\n{'═' * 80}")
    print(f"  TOP 5 FINALISTS")
    print(f"{'═' * 80}")
    header = f"  {'#':<3} {'ID':<6} {'Label':<36} {'Score':<8} {'Silh':<6} {'Bal':<6} {'Wgt':<6} {'Fav':<6} {'Rec':<6} {'Uniq':<6} {'Prem':<6} {'Desk':<6}"
    print(header)
    print(f"  {'─'*3} {'─'*6} {'─'*36} {'─'*8} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6}")
    for i, f in enumerate(finalists):
        v = f["variant"]
        s = f["scores"]
        print(f"  {i+1:<3} {v.id:<6} {v.label:<36} {s['overall']:<8.3f} "
              f"{s['silhouette']:<6.1f} {s['balance']:<6.1f} {s['weight']:<6.1f} "
              f"{s['favicon']:<6.1f} {s['recognizability']:<6.1f} {s['uniqueness']:<6.1f} "
              f"{s['premium']:<6.1f} {s['desktop']:<6.1f}")

    # Finalist sheet
    print(f"\n▸ Rendering finalist comparison...")
    make_finalist_comparison(finalists, output_dir / "round2_finalists.png")

    # Winner
    winner = finalists[0]
    wv = winner["variant"]
    ws = winner["scores"]
    wm = winner["metrics"]
    wcfg = winner["config"]

    print(f"\n{'═' * 60}")
    print(f"  WINNER: {wv.id} — {wv.label}")
    print(f"  Overall Score: {ws['overall']:.3f}")
    print(f"  Delta vs baseline: {ws['overall'] - bs['overall']:+.3f}")
    print(f"{'═' * 60}")

    # Export winner
    preset = {
        "name": "ornas_refined_v2",
        "description": f"Round 2 winner: {wv.label} (score {ws['overall']:.3f})",
        "overrides": wv.overrides,
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
        },
        "scores": ws,
        "metrics": wm,
    }
    (output_dir / "winner_preset_v2.json").write_text(json.dumps(preset, indent=2))

    # Export winner at all validation sizes
    print(f"\n▸ Exporting winner at all validation sizes...")
    winner_dir = output_dir / "winner"
    winner_dir.mkdir(parents=True, exist_ok=True)
    winner_logo = winner["logo"]

    for sz in [16, 20, 24, 32, 48, 64, 128, 256, 512]:
        export_png(winner_logo, winner_dir / f"icon-{sz}.png", sz, SCHEME_ACCENT)
    export_svg(winner_logo, winner_dir / "icon.svg", SCHEME_ACCENT)

    # Full results
    export_results = []
    for r in ranked:
        v = r["variant"]
        export_results.append({
            "rank": ranked.index(r) + 1,
            "id": v.id, "label": v.label,
            "overrides": dict(v.overrides),
            "scores": r["scores"],
            "metrics": r["metrics"],
            "fav16": r["fav16"], "fav32": r["fav32"],
        })
    (output_dir / "round2_results.json").write_text(json.dumps(export_results, indent=2))

    print(f"\n✓ Round 2 complete. {len(all_results)} variants evaluated.")


if __name__ == "__main__":
    main()
