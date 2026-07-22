#!/usr/bin/env python3
"""
ORNAS Logo Geometry Refinement — Systematic Parameter Exploration
==================================================================

Generates ~45 controlled logo variants, each modifying EXACTLY ONE
parameter from the baseline. Evaluates every variant on measurable
geometric criteria, ranks them, and selects the strongest candidate.

Run from: /home/sanro/ORNAS/branding/
    python refine_geometry.py
"""

from __future__ import annotations

import io
import json
import math
import sys
from dataclasses import asdict, fields
from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely.ops import unary_union

# Add generator to path
sys.path.insert(0, str(Path(__file__).parent))
from generator.config import LogoConfig, SCHEME_ACCENT, SCHEME_LIGHT, ColorScheme
from generator.export import svg_to_png_bytes
from generator.logo import OrnasLogo


# ═══════════════════════════════════════════════════════════════════════════
# Variant Definition
# ═══════════════════════════════════════════════════════════════════════════

class Variant(NamedTuple):
    """A single-parameter variant to evaluate."""
    id: str
    param: str
    value: float
    label: str


BASELINE = LogoConfig()

# All variants: (id, parameter_name, new_value, human_label)
VARIANTS: list[Variant] = [
    # ── Ring Thickness (baseline: 54) ──────────────────────────────────
    Variant("T01", "body_thickness", 48.0, "thickness 48"),
    Variant("T02", "body_thickness", 50.0, "thickness 50"),
    Variant("T03", "body_thickness", 52.0, "thickness 52"),
    Variant("T04", "body_thickness", 56.0, "thickness 56"),
    Variant("T05", "body_thickness", 58.0, "thickness 58"),
    Variant("T06", "body_thickness", 60.0, "thickness 60"),

    # ── Outer Radius (baseline: 155) ───────────────────────────────────
    Variant("R01", "body_radius_x", 148.0, "radius 148"),
    Variant("R02", "body_radius_x", 152.0, "radius 152"),
    Variant("R03", "body_radius_x", 158.0, "radius 158"),
    Variant("R04", "body_radius_x", 162.0, "radius 162"),

    # ── Squircle Power (baseline: 4.0) ─────────────────────────────────
    Variant("P01", "squircle_power", 3.0, "power 3.0"),
    Variant("P02", "squircle_power", 3.5, "power 3.5"),
    Variant("P03", "squircle_power", 4.5, "power 4.5"),
    Variant("P04", "squircle_power", 5.0, "power 5.0"),
    Variant("P05", "squircle_power", 5.5, "power 5.5"),

    # ── Bracket Height (baseline: 65) ──────────────────────────────────
    Variant("BH01", "bracket_height", 55.0, "bracket H 55"),
    Variant("BH02", "bracket_height", 60.0, "bracket H 60"),
    Variant("BH03", "bracket_height", 70.0, "bracket H 70"),
    Variant("BH04", "bracket_height", 75.0, "bracket H 75"),

    # ── Bracket Overlap (baseline: 15) ─────────────────────────────────
    Variant("BO01", "bracket_overlap", 10.0, "overlap 10"),
    Variant("BO02", "bracket_overlap", 12.0, "overlap 12"),
    Variant("BO03", "bracket_overlap", 18.0, "overlap 18"),
    Variant("BO04", "bracket_overlap", 20.0, "overlap 20"),

    # ── Bracket Leg Thickness (baseline: 26) ───────────────────────────
    Variant("BL01", "bracket_leg_thickness", 22.0, "leg 22"),
    Variant("BL02", "bracket_leg_thickness", 24.0, "leg 24"),
    Variant("BL03", "bracket_leg_thickness", 28.0, "leg 28"),
    Variant("BL04", "bracket_leg_thickness", 30.0, "leg 30"),

    # ── Bracket Corner Radius (baseline: 20) ──────────────────────────
    Variant("BC01", "bracket_corner_radius", 14.0, "bracket r 14"),
    Variant("BC02", "bracket_corner_radius", 17.0, "bracket r 17"),
    Variant("BC03", "bracket_corner_radius", 23.0, "bracket r 23"),
    Variant("BC04", "bracket_corner_radius", 26.0, "bracket r 26"),

    # ── Handle Width (baseline: 100) ───────────────────────────────────
    Variant("HW01", "handle_width", 88.0, "handle W 88"),
    Variant("HW02", "handle_width", 94.0, "handle W 94"),
    Variant("HW03", "handle_width", 106.0, "handle W 106"),
    Variant("HW04", "handle_width", 112.0, "handle W 112"),

    # ── Handle Height (baseline: 45) ───────────────────────────────────
    Variant("HH01", "handle_height", 38.0, "handle H 38"),
    Variant("HH02", "handle_height", 42.0, "handle H 42"),
    Variant("HH03", "handle_height", 48.0, "handle H 48"),
    Variant("HH04", "handle_height", 52.0, "handle H 52"),

    # ── Handle Corner Radius (baseline: 20) ────────────────────────────
    Variant("HR01", "handle_corner_radius", 14.0, "handle r 14"),
    Variant("HR02", "handle_corner_radius", 17.0, "handle r 17"),
    Variant("HR03", "handle_corner_radius", 24.0, "handle r 24"),

    # ── Slot Width (baseline: 48) ──────────────────────────────────────
    Variant("SW01", "slot_width", 40.0, "slot W 40"),
    Variant("SW02", "slot_width", 44.0, "slot W 44"),
    Variant("SW03", "slot_width", 52.0, "slot W 52"),
    Variant("SW04", "slot_width", 56.0, "slot W 56"),

    # ── Slot Height (baseline: 16) ─────────────────────────────────────
    Variant("SH01", "slot_height", 12.0, "slot H 12"),
    Variant("SH02", "slot_height", 14.0, "slot H 14"),
    Variant("SH03", "slot_height", 18.0, "slot H 18"),
    Variant("SH04", "slot_height", 20.0, "slot H 20"),
]


# ═══════════════════════════════════════════════════════════════════════════
# Metrics Computation
# ═══════════════════════════════════════════════════════════════════════════

def make_config(variant: Variant) -> LogoConfig:
    """Create a LogoConfig with exactly one parameter changed."""
    base = asdict(BASELINE)
    base.pop("export_sizes", None)

    # For radius variants, keep x and y in sync
    if variant.param == "body_radius_x":
        base["body_radius_x"] = variant.value
        base["body_radius_y"] = variant.value
    else:
        base[variant.param] = variant.value

    return LogoConfig(**base, export_sizes=BASELINE.export_sizes)


def compute_metrics(logo: OrnasLogo) -> dict[str, float]:
    """
    Compute measurable geometric quality metrics.

    Returns a dictionary of named metrics, each normalized or in meaningful units.
    """
    cfg = logo.config
    canvas_area = cfg.canvas_size ** 2

    ring = logo.ring
    bracket = logo.bracket
    combined = unary_union([ring, bracket])

    ring_area = ring.area
    bracket_area = bracket.area
    total_area = combined.area

    # Bounding box
    minx, miny, maxx, maxy = combined.bounds
    bbox_w = maxx - minx
    bbox_h = maxy - miny

    # ── Metrics ───────────────────────────────────────────────────────

    # 1. Fill ratio: how much of the canvas is used (too sparse = weak, too dense = cramped)
    #    Ideal range: 0.20–0.30 for a logo on a 512 canvas
    fill_ratio = total_area / canvas_area

    # 2. Ring-to-bracket ratio: proportional balance between the two elements
    #    The ring should be the dominant element (4:1 to 6:1 is ideal)
    rb_ratio = ring_area / bracket_area if bracket_area > 0 else 999

    # 3. Aspect ratio of bounding box (width / height)
    #    Closer to 1.0 = more square = better for app icons
    aspect = bbox_w / bbox_h if bbox_h > 0 else 1.0

    # 4. Vertical center of mass relative to canvas center
    #    Slight downward shift is optically balanced (0.52–0.56 ideal)
    centroid = combined.centroid
    vertical_center = centroid.y / cfg.canvas_size

    # 5. Horizontal symmetry check (centroid x offset from canvas center)
    h_offset = abs(centroid.x - cfg.canvas_size / 2)

    # 6. Whitespace balance: ratio of top padding to bottom padding
    top_pad = miny
    bottom_pad = cfg.canvas_size - maxy
    ws_ratio = min(top_pad, bottom_pad) / max(top_pad, bottom_pad) if max(top_pad, bottom_pad) > 0 else 0

    # 7. Ring wall ratio: thickness / outer_radius (optimal ~0.30–0.40)
    wall_ratio = cfg.body_thickness / cfg.body_radius_x

    # 8. Compactness: perimeter² / (4π × area) — circle = 1.0
    perimeter = combined.length
    compactness = perimeter ** 2 / (4 * math.pi * total_area) if total_area > 0 else 999

    return {
        "fill_ratio": round(fill_ratio, 4),
        "rb_ratio": round(rb_ratio, 3),
        "aspect": round(aspect, 4),
        "v_center": round(vertical_center, 4),
        "h_offset": round(h_offset, 2),
        "ws_ratio": round(ws_ratio, 4),
        "wall_ratio": round(wall_ratio, 4),
        "compactness": round(compactness, 3),
        "ring_area": round(ring_area, 1),
        "bracket_area": round(bracket_area, 1),
        "total_area": round(total_area, 1),
    }


def favicon_clarity(logo: OrnasLogo, size: int = 16) -> float:
    """
    Measure favicon readability as the ratio of non-transparent pixels
    that form distinct features (edge pixels) at the given size.

    Higher = more detail preserved = better readability.
    """
    svg_str = logo.to_svg(scheme=SCHEME_ACCENT)
    png_bytes = svg_to_png_bytes(svg_str, size)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    arr = np.array(img)

    # Count non-transparent pixels
    alpha = arr[:, :, 3]
    filled = np.sum(alpha > 128)

    # Count edge pixels (where alpha transitions)
    edges_h = np.sum(np.abs(np.diff(alpha.astype(float), axis=1)) > 64)
    edges_v = np.sum(np.abs(np.diff(alpha.astype(float), axis=0)) > 64)
    total_edges = edges_h + edges_v

    # Edge-to-fill ratio — higher means more detail per pixel
    if filled == 0:
        return 0.0
    return round(total_edges / filled, 4)


# ═══════════════════════════════════════════════════════════════════════════
# Scoring
# ═══════════════════════════════════════════════════════════════════════════

def score_variant(metrics: dict[str, float], fav_16: float, fav_32: float) -> dict[str, float]:
    """
    Score a variant on 8 criteria (1–10 each) based on geometric heuristics.

    Scoring philosophy:
    - Each criterion has an ideal target value
    - Score decays as the metric diverges from the ideal
    - All scores use smooth gaussian-like falloff
    """

    def gaussian_score(value: float, ideal: float, sigma: float) -> float:
        """Score 1–10 based on distance from ideal."""
        deviation = abs(value - ideal) / sigma
        raw = math.exp(-0.5 * deviation ** 2)
        return round(1 + 9 * raw, 1)

    scores = {}

    # 1. Silhouette quality: fill ratio should be ~0.24 (not too sparse, not cramped)
    scores["silhouette"] = gaussian_score(metrics["fill_ratio"], 0.24, 0.04)

    # 2. Optical balance: vertical center at ~0.55 (slightly below geometric center)
    scores["balance"] = gaussian_score(metrics["v_center"], 0.55, 0.04)

    # 3. Visual weight: ring-to-bracket ratio at ~4.5 (ring dominates but bracket is visible)
    scores["weight"] = gaussian_score(metrics["rb_ratio"], 4.5, 1.5)

    # 4. Favicon readability: edge detail at 16px (higher = better)
    scores["favicon"] = gaussian_score(fav_16, 0.85, 0.25)

    # 5. Recognizability: aspect ratio near 0.78 (slightly taller than wide, like an icon)
    scores["recognizability"] = gaussian_score(metrics["aspect"], 0.78, 0.10)

    # 6. Uniqueness: wall ratio at ~0.35 (distinctive thick ring)
    scores["uniqueness"] = gaussian_score(metrics["wall_ratio"], 0.35, 0.06)

    # 7. Premium feel: whitespace balance at ~0.65 (slightly more top padding than bottom)
    scores["premium"] = gaussian_score(metrics["ws_ratio"], 0.65, 0.15)

    # 8. Desktop suitability: compactness at ~3.5 (complex but not noisy)
    scores["desktop"] = gaussian_score(metrics["compactness"], 3.5, 1.0)

    # Overall weighted score
    weights = {
        "silhouette": 1.2,
        "balance": 1.0,
        "weight": 1.0,
        "favicon": 1.5,   # Favicon readability is critical
        "recognizability": 1.0,
        "uniqueness": 0.8,
        "premium": 0.8,
        "desktop": 0.7,
    }
    total_weight = sum(weights.values())
    weighted = sum(scores[k] * weights[k] for k in scores) / total_weight
    scores["overall"] = round(weighted, 2)

    return scores


# ═══════════════════════════════════════════════════════════════════════════
# Rendering
# ═══════════════════════════════════════════════════════════════════════════

def render_logo(logo: OrnasLogo, size: int, scheme: ColorScheme = SCHEME_ACCENT) -> Image.Image:
    """Render a logo to a Pillow Image."""
    svg_str = logo.to_svg(scheme=scheme)
    png_bytes = svg_to_png_bytes(svg_str, size)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


def load_font(size: int = 12) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("DejaVuSans", "FreeSans", "Arial"):
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def make_comparison_grid(
    results: list[dict[str, Any]],
    output_path: Path,
    cols: int = 8,
    cell_size: int = 200,
) -> Path:
    """Create a grid of all variants with labels and scores."""
    n = len(results)
    rows = math.ceil(n / cols)

    label_h = 48
    total_w = cols * cell_size
    total_h = rows * (cell_size + label_h)

    bg = (13, 13, 26, 255)
    canvas = Image.new("RGBA", (total_w, total_h), bg)
    draw = ImageDraw.Draw(canvas)
    font = load_font(11)
    font_sm = load_font(9)

    for i, r in enumerate(results):
        col = i % cols
        row = i // cols
        x = col * cell_size
        y = row * (cell_size + label_h)

        # Render logo
        img = render_logo(r["logo"], cell_size - 20)
        canvas.paste(img, (x + 10, y + 5), mask=img)

        # Label
        label = r["variant"].id if "variant" in r else "BASE"
        score_str = f"{r['scores']['overall']:.1f}"
        param_label = r.get("variant", Variant("BASE", "", 0, "baseline")).label

        draw.text((x + 5, y + cell_size - 12), label, fill=(255, 255, 255, 220), font=font)
        draw.text((x + cell_size - 35, y + cell_size - 12), score_str, fill=(0, 212, 255, 220), font=font)
        draw.text((x + 5, y + cell_size + 3), param_label, fill=(180, 180, 200, 180), font=font_sm)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG")
    return output_path


def make_finalist_sheet(
    finalists: list[dict[str, Any]],
    output_path: Path,
) -> Path:
    """Create a detailed finalist comparison with multi-size previews."""
    n = len(finalists)
    sizes = [16, 24, 32, 48, 64, 128, 256]
    col_w = 320
    row_h = 320
    total_w = n * col_w
    total_h = row_h + 80  # extra for labels

    bg = (13, 13, 26, 255)
    canvas = Image.new("RGBA", (total_w, total_h), bg)
    draw = ImageDraw.Draw(canvas)
    font = load_font(14)
    font_sm = load_font(10)

    for i, f in enumerate(finalists):
        x_off = i * col_w

        # Title
        vid = f.get("variant", Variant("BASE", "", 0, "baseline"))
        title = f"{vid.id}: {vid.label}" if hasattr(vid, 'id') else "BASELINE"
        draw.text((x_off + 10, 8), title, fill=(255, 255, 255, 240), font=font)
        draw.text(
            (x_off + 10, 26),
            f"Score: {f['scores']['overall']:.2f}",
            fill=(0, 212, 255, 240),
            font=font_sm,
        )

        # Multi-size strip
        sx = x_off + 10
        sy = 50
        for sz in sizes:
            img = render_logo(f["logo"], sz)
            # Bottom-align all sizes
            y_pos = sy + (128 - sz)
            canvas.paste(img, (sx, y_pos), mask=img)
            draw.text((sx, sy + 130), f"{sz}", fill=(150, 150, 170, 160), font=font_sm)
            sx += sz + 6

        # Larger preview
        big = render_logo(f["logo"], 200)
        canvas.paste(big, (x_off + 60, 195), mask=big)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════
# Main Pipeline
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    output_dir = Path(__file__).parent / "refinement_output"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("ORNAS Logo Geometry Refinement")
    print("=" * 60)

    # ── 1. Evaluate baseline ──────────────────────────────────────────
    print(f"\n▸ Evaluating baseline...")
    baseline_logo = OrnasLogo(BASELINE)
    baseline_metrics = compute_metrics(baseline_logo)
    baseline_fav16 = favicon_clarity(baseline_logo, 16)
    baseline_fav32 = favicon_clarity(baseline_logo, 32)
    baseline_scores = score_variant(baseline_metrics, baseline_fav16, baseline_fav32)

    baseline_result = {
        "variant": Variant("BASE", "", 0, "baseline"),
        "config": BASELINE,
        "logo": baseline_logo,
        "metrics": baseline_metrics,
        "fav16": baseline_fav16,
        "fav32": baseline_fav32,
        "scores": baseline_scores,
    }

    print(f"  Baseline overall score: {baseline_scores['overall']:.2f}")
    print(f"  Metrics: fill={baseline_metrics['fill_ratio']}, "
          f"rb_ratio={baseline_metrics['rb_ratio']}, "
          f"aspect={baseline_metrics['aspect']}, "
          f"wall={baseline_metrics['wall_ratio']}")

    # ── 2. Generate all variants ──────────────────────────────────────
    print(f"\n▸ Generating {len(VARIANTS)} variants (one param each)...")
    all_results: list[dict[str, Any]] = [baseline_result]

    for v in VARIANTS:
        try:
            cfg = make_config(v)
            logo = OrnasLogo(cfg)
            metrics = compute_metrics(logo)
            fav16 = favicon_clarity(logo, 16)
            fav32 = favicon_clarity(logo, 32)
            scores = score_variant(metrics, fav16, fav32)

            result = {
                "variant": v,
                "config": cfg,
                "logo": logo,
                "metrics": metrics,
                "fav16": fav16,
                "fav32": fav32,
                "scores": scores,
            }
            all_results.append(result)

            delta = scores["overall"] - baseline_scores["overall"]
            marker = "▲" if delta > 0.1 else "▼" if delta < -0.1 else "─"
            print(f"  {v.id:5s}  {v.label:20s}  score={scores['overall']:.2f}  Δ={delta:+.2f} {marker}")

        except Exception as e:
            print(f"  {v.id:5s}  {v.label:20s}  FAILED: {e}")

    # ── 3. Rank all variants ──────────────────────────────────────────
    print(f"\n▸ Ranking {len(all_results)} total candidates...")
    ranked = sorted(all_results, key=lambda r: r["scores"]["overall"], reverse=True)

    # ── 4. Create comparison grid ─────────────────────────────────────
    print(f"\n▸ Rendering comparison grid...")
    grid_path = make_comparison_grid(ranked, output_dir / "comparison_grid.png")
    print(f"  → {grid_path}")

    # ── 5. Select top 5 finalists ─────────────────────────────────────
    finalists = ranked[:5]
    print(f"\n▸ Top 5 Finalists:")
    print(f"  {'Rank':<5} {'ID':<6} {'Label':<22} {'Overall':<8} {'Silh':<6} {'Bal':<6} {'Wgt':<6} {'Fav':<6} {'Rec':<6} {'Uniq':<6} {'Prem':<6} {'Desk':<6}")
    print(f"  {'─'*5} {'─'*6} {'─'*22} {'─'*8} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6} {'─'*6}")
    for i, f in enumerate(finalists):
        v = f["variant"]
        s = f["scores"]
        print(f"  {i+1:<5} {v.id:<6} {v.label:<22} {s['overall']:<8.2f} "
              f"{s['silhouette']:<6.1f} {s['balance']:<6.1f} {s['weight']:<6.1f} "
              f"{s['favicon']:<6.1f} {s['recognizability']:<6.1f} {s['uniqueness']:<6.1f} "
              f"{s['premium']:<6.1f} {s['desktop']:<6.1f}")

    # ── 6. Create finalist sheet ──────────────────────────────────────
    print(f"\n▸ Rendering finalist comparison sheet...")
    finalist_path = make_finalist_sheet(finalists, output_dir / "finalist_sheet.png")
    print(f"  → {finalist_path}")

    # ── 7. Declare winner ─────────────────────────────────────────────
    winner = finalists[0]
    wv = winner["variant"]
    ws = winner["scores"]
    wm = winner["metrics"]

    print(f"\n{'═' * 60}")
    print(f"  WINNER: {wv.id} — {wv.label}")
    print(f"  Overall Score: {ws['overall']:.2f}")
    print(f"{'═' * 60}")

    # ── 8. Export winner preset ────────────────────────────────────────
    winner_cfg = winner["config"]
    preset = {
        "name": "ornas_refined_v1",
        "description": f"Winner: {wv.label} (score {ws['overall']:.2f})",
        "canvas_size": winner_cfg.canvas_size,
        "body_center_y_ratio": winner_cfg.body_center_y_ratio,
        "body_radius_x": winner_cfg.body_radius_x,
        "body_radius_y": winner_cfg.body_radius_y,
        "body_thickness": winner_cfg.body_thickness,
        "squircle_power": winner_cfg.squircle_power,
        "bracket_height": winner_cfg.bracket_height,
        "bracket_overlap": winner_cfg.bracket_overlap,
        "bracket_leg_thickness": winner_cfg.bracket_leg_thickness,
        "bracket_corner_radius": winner_cfg.bracket_corner_radius,
        "handle_width": winner_cfg.handle_width,
        "handle_height": winner_cfg.handle_height,
        "handle_corner_radius": winner_cfg.handle_corner_radius,
        "slot_width": winner_cfg.slot_width,
        "slot_height": winner_cfg.slot_height,
        "slot_corner_radius": winner_cfg.slot_corner_radius,
        "inner_bracket_inset": winner_cfg.inner_bracket_inset,
        "inner_bracket_corner_radius": winner_cfg.inner_bracket_corner_radius,
        "scores": ws,
        "metrics": wm,
    }

    preset_path = output_dir / "winner_preset.json"
    preset_path.write_text(json.dumps(preset, indent=2), encoding="utf-8")
    print(f"\n▸ Winner preset saved → {preset_path}")

    # ── 9. Full results table ─────────────────────────────────────────
    results_path = output_dir / "all_results.json"
    export_results = []
    for r in ranked:
        v = r["variant"]
        export_results.append({
            "rank": ranked.index(r) + 1,
            "id": v.id,
            "param": v.param,
            "value": v.value,
            "label": v.label,
            "scores": r["scores"],
            "metrics": r["metrics"],
            "fav16": r["fav16"],
            "fav32": r["fav32"],
        })
    results_path.write_text(json.dumps(export_results, indent=2), encoding="utf-8")
    print(f"▸ Full results table saved → {results_path}")

    # ── 10. Bottom 5 (rejected) ───────────────────────────────────────
    print(f"\n▸ Bottom 5 (rejected):")
    for r in ranked[-5:]:
        v = r["variant"]
        s = r["scores"]
        print(f"  {v.id:<6} {v.label:<22} score={s['overall']:.2f}")

    print(f"\n✓ Refinement complete. {len(all_results)} variants evaluated.")
    print(f"  Output directory: {output_dir}")


if __name__ == "__main__":
    main()
