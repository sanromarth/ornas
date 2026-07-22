"""
export.py — SVG / PNG / ICO Export Pipeline
=============================================

Handles all file output.  Converts ``OrnasLogo`` instances to:
    • SVG  — via ``svgwrite`` (lossless vector)
    • PNG  — via ``cairosvg`` (rasterized)
    • ICO  — via ``Pillow`` (multi-resolution Windows icon)

Every function accepts paths and returns the written path for chaining.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Sequence

from PIL import Image

from .config import ColorScheme, LogoConfig, SCHEME_ACCENT
from .logo import OrnasLogo


def export_svg(
    logo: OrnasLogo,
    output_path: Path,
    scheme: ColorScheme = SCHEME_ACCENT,
    *,
    padding: float = 0.0,
) -> Path:
    """
    Write the logo to an SVG file.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination file path.
    scheme : ColorScheme
        Color variant to render.
    padding : float
        Extra padding around the canvas edge.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    svg_str = logo.to_svg(scheme=scheme, padding=padding)
    output_path.write_text(svg_str, encoding="utf-8")
    return output_path


def export_svg_combined(
    logo: OrnasLogo,
    output_path: Path,
    fill: str = "#000000",
    *,
    padding: float = 0.0,
) -> Path:
    """Write a monochrome single-path SVG."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    svg_str = logo.to_svg_combined(fill=fill, padding=padding)
    output_path.write_text(svg_str, encoding="utf-8")
    return output_path


def svg_to_png_bytes(svg_string: str, size: int) -> bytes:
    """
    Rasterize an SVG string to PNG bytes at the specified size.

    Uses ``cairosvg`` for high-quality anti-aliased rendering.

    Parameters
    ----------
    svg_string : str
        Complete SVG document.
    size : int
        Output width and height in pixels.

    Returns
    -------
    bytes
        Raw PNG data.
    """
    import cairosvg

    return cairosvg.svg2png(
        bytestring=svg_string.encode("utf-8"),
        output_width=size,
        output_height=size,
    )


def export_png(
    logo: OrnasLogo,
    output_path: Path,
    size: int,
    scheme: ColorScheme = SCHEME_ACCENT,
) -> Path:
    """
    Export the logo as a PNG at a specific pixel size.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination file path.
    size : int
        Width and height in pixels.
    scheme : ColorScheme
        Color variant to render.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    svg_str = logo.to_svg(scheme=scheme)
    png_bytes = svg_to_png_bytes(svg_str, size)
    output_path.write_bytes(png_bytes)
    return output_path


def export_png_combined(
    logo: OrnasLogo,
    output_path: Path,
    size: int,
    fill: str = "#000000",
) -> Path:
    """Export a monochrome single-path PNG."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    svg_str = logo.to_svg_combined(fill=fill)
    png_bytes = svg_to_png_bytes(svg_str, size)
    output_path.write_bytes(png_bytes)
    return output_path


def export_ico(
    logo: OrnasLogo,
    output_path: Path,
    sizes: Sequence[int] = (16, 24, 32, 48, 64, 128, 256),
    scheme: ColorScheme = SCHEME_ACCENT,
) -> Path:
    """
    Export as a multi-resolution .ico file.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_path : Path
        Destination .ico path.
    sizes : Sequence[int]
        Pixel sizes to embed in the ICO.
    scheme : ColorScheme
        Color variant to render.

    Returns
    -------
    Path
        The written file path.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    svg_str = logo.to_svg(scheme=scheme)
    images: list[Image.Image] = []

    for sz in sorted(sizes):
        png_bytes = svg_to_png_bytes(svg_str, sz)
        img = Image.open(io.BytesIO(png_bytes))
        images.append(img)

    # Save as ICO — the first image is the primary
    images[0].save(
        output_path,
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:],
    )
    return output_path


def export_sizes(
    logo: OrnasLogo,
    output_dir: Path,
    sizes: Sequence[int],
    scheme: ColorScheme = SCHEME_ACCENT,
    *,
    prefix: str = "icon",
    fmt: str = "png",
) -> list[Path]:
    """
    Batch-export at multiple pixel sizes.

    Parameters
    ----------
    logo : OrnasLogo
        A built logo instance.
    output_dir : Path
        Directory to write files into.
    sizes : Sequence[int]
        List of pixel sizes.
    scheme : ColorScheme
        Color variant.
    prefix : str
        Filename prefix (e.g., ``"icon"`` → ``"icon-32.png"``).
    fmt : str
        Output format: ``"png"`` or ``"svg"``.

    Returns
    -------
    list[Path]
        All written file paths.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    for sz in sizes:
        filename = f"{prefix}-{sz}.{fmt}"
        path = output_dir / filename

        if fmt == "png":
            export_png(logo, path, sz, scheme)
        elif fmt == "svg":
            scaled_config = logo.config.at_size(sz)
            scaled_logo = OrnasLogo(scaled_config)
            export_svg(scaled_logo, path, scheme)
        else:
            raise ValueError(f"Unsupported format: {fmt!r}")

        written.append(path)

    return written
