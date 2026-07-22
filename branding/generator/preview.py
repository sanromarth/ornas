"""
preview.py — Preview Sheet Composition
========================================

Generates visual preview sheets using Pillow for quick QA:
    • Size sheet    — the logo at every export size on one image
    • Variant sheet — every color scheme side by side
    • Context sheet — the logo on light / dark / gradient backgrounds
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Sequence

from PIL import Image, ImageDraw, ImageFont

from .config import ColorScheme, LogoConfig, ALL_SCHEMES, SCHEME_ACCENT, SCHEME_DARK
from .export import svg_to_png_bytes
from .logo import OrnasLogo


# ── Defaults ──────────────────────────────────────────────────────────────

_SHEET_BG = (13, 13, 26, 255)  # #0D0D1A
_LABEL_COLOR = (255, 255, 255, 180)
_PADDING = 40
_GAP = 30


def _load_font(size: int = 14) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Try to load a clean sans-serif font, fall back to default."""
    for name in ("Inter", "DejaVuSans", "FreeSans", "Arial"):
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _render_logo_image(
    logo: OrnasLogo,
    size: int,
    scheme: ColorScheme,
    background: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """Render a logo to a Pillow Image at the given size."""
    svg_str = logo.to_svg(scheme=scheme)
    png_bytes = svg_to_png_bytes(svg_str, size)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")

    if background is not None:
        bg = Image.new("RGBA", img.size, background)
        bg.paste(img, mask=img)
        return bg

    return img


# ═══════════════════════════════════════════════════════════════════════════
# Size Preview Sheet
# ═══════════════════════════════════════════════════════════════════════════

def generate_size_sheet(
    logo: OrnasLogo,
    output_path: Path,
    sizes: Sequence[int] = (16, 24, 32, 48, 64, 128, 256, 512),
    scheme: ColorScheme = SCHEME_ACCENT,
) -> Path:
    """
    Create a preview showing the logo at each export size.

    Each size is rendered at its native resolution and placed on
    a dark canvas with a label beneath it.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination PNG path.
    sizes : Sequence[int]
        Sizes to render.
    scheme : ColorScheme
        Color variant.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    font = _load_font(14)

    # Calculate canvas dimensions
    max_h = max(sizes)
    total_w = _PADDING * 2 + sum(sizes) + _GAP * (len(sizes) - 1)
    total_h = _PADDING * 2 + max_h + 30  # 30px for labels

    canvas = Image.new("RGBA", (total_w, total_h), _SHEET_BG)
    draw = ImageDraw.Draw(canvas)

    x = _PADDING
    for sz in sizes:
        img = _render_logo_image(logo, sz, scheme)
        # Vertically center each icon, bottom-aligned to the largest
        y = _PADDING + (max_h - sz)
        canvas.paste(img, (x, y), mask=img)

        # Label
        label = f"{sz}px"
        draw.text(
            (x + sz // 2, _PADDING + max_h + 8),
            label,
            fill=_LABEL_COLOR,
            font=font,
            anchor="mt",
        )
        x += sz + _GAP

    canvas.save(output_path, "PNG")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════
# Color Variant Sheet
# ═══════════════════════════════════════════════════════════════════════════

def generate_variant_sheet(
    logo: OrnasLogo,
    output_path: Path,
    schemes: Sequence[ColorScheme] = tuple(ALL_SCHEMES),
    render_size: int = 256,
) -> Path:
    """
    Create a preview showing every color variant side by side.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination PNG path.
    schemes : Sequence[ColorScheme]
        Color schemes to render.
    render_size : int
        Size to render each variant at.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    font = _load_font(16)

    n = len(schemes)
    total_w = _PADDING * 2 + render_size * n + _GAP * (n - 1)
    total_h = _PADDING * 2 + render_size + 30

    canvas = Image.new("RGBA", (total_w, total_h), _SHEET_BG)
    draw = ImageDraw.Draw(canvas)

    x = _PADDING
    for sch in schemes:
        # Choose a contrasting background chip
        if sch.body_fill.upper() == "#FFFFFF" or sch.bracket_fill.upper() == "#FFFFFF":
            bg = (30, 30, 50, 255)
        else:
            bg = (240, 240, 245, 255)

        img = _render_logo_image(logo, render_size, sch, background=bg)
        canvas.paste(img, (x, _PADDING), mask=None)

        draw.text(
            (x + render_size // 2, _PADDING + render_size + 8),
            sch.name,
            fill=_LABEL_COLOR,
            font=font,
            anchor="mt",
        )
        x += render_size + _GAP

    canvas.save(output_path, "PNG")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════
# Context / Background Sheet
# ═══════════════════════════════════════════════════════════════════════════

def generate_context_sheet(
    logo: OrnasLogo,
    output_path: Path,
    render_size: int = 256,
) -> Path:
    """
    Show the logo on light, dark, and gradient backgrounds.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination PNG path.
    render_size : int
        Render size for each panel.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    font = _load_font(14)

    panel_w = render_size + _PADDING * 2
    panels = [
        ("Dark BG", (13, 13, 26, 255), SCHEME_ACCENT),
        ("Light BG", (245, 245, 250, 255), ColorScheme("ctx-light", "#000000", "#0099BB", None)),
        ("Gradient", None, SCHEME_DARK),
    ]

    total_w = panel_w * len(panels)
    total_h = render_size + _PADDING * 2 + 30
    canvas = Image.new("RGBA", (total_w, total_h), _SHEET_BG)
    draw = ImageDraw.Draw(canvas)

    for i, (label, bg_color, scheme) in enumerate(panels):
        x_off = i * panel_w
        panel = Image.new("RGBA", (panel_w, total_h - 30), (0, 0, 0, 0))

        if bg_color is not None:
            panel_draw = ImageDraw.Draw(panel)
            panel_draw.rectangle(
                [(0, 0), (panel_w, total_h - 30)],
                fill=bg_color,
            )
        else:
            # Gradient background
            for y_row in range(total_h - 30):
                ratio = y_row / (total_h - 30)
                r = int(13 + (40 - 13) * ratio)
                g = int(13 + (20 - 13) * ratio)
                b = int(26 + (60 - 26) * ratio)
                ImageDraw.Draw(panel).line(
                    [(0, y_row), (panel_w, y_row)],
                    fill=(r, g, b, 255),
                )

        img = _render_logo_image(logo, render_size, scheme)
        panel.paste(img, (_PADDING, _PADDING), mask=img)
        canvas.paste(panel, (x_off, 0))

        draw.text(
            (x_off + panel_w // 2, total_h - 22),
            label,
            fill=_LABEL_COLOR,
            font=font,
            anchor="mt",
        )

    canvas.save(output_path, "PNG")
    return output_path
