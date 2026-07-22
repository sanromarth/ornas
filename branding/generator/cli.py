"""
cli.py — Command-Line Interface
=================================

Provides a ``typer``-based CLI for the ORNAS brand generator.

Usage::

    python -m generator build --output ./brand_output
    python -m generator svg --output ./svgs
    python -m generator png --output ./pngs --sizes 32,64,128,256
    python -m generator ico --output ./icon.ico
    python -m generator preview --output ./previews
    python -m generator tauri --output ./src-tauri/icons
    python -m generator sweep squircle_power 2.5 3.0 3.5 4.0 5.0 6.0
    python -m generator info
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Optional

import typer

from .config import (
    ALL_SCHEMES,
    LogoConfig,
    SCHEME_ACCENT,
)
from .generator import BrandGenerator
from .logo import OrnasLogo

app = typer.Typer(
    name="ornas-brand",
    help="ORNAS procedural brand generator — regenerate every icon from parameters.",
    add_completion=False,
    rich_markup_mode="rich",
)


def _resolve_scheme(name: str):
    """Look up a color scheme by name."""
    for s in ALL_SCHEMES:
        if s.name == name:
            return s
    raise typer.BadParameter(f"Unknown scheme: {name!r}. Available: {[s.name for s in ALL_SCHEMES]}")


# ── Commands ──────────────────────────────────────────────────────────────


@app.command()
def build(
    output: Annotated[Path, typer.Option("--output", "-o", help="Output directory")] = Path("./brand_output"),
    canvas: Annotated[int, typer.Option("--canvas", help="Canvas size in px")] = 512,
    power: Annotated[float, typer.Option("--power", help="Squircle exponent")] = 4.0,
    thickness: Annotated[float, typer.Option("--thickness", help="Ring wall thickness")] = 54.0,
) -> None:
    """Generate the complete brand asset suite."""
    config = LogoConfig(
        canvas_size=canvas,
        squircle_power=power,
        body_thickness=thickness,
    )
    gen = BrandGenerator(config)

    typer.echo(f"⚙  Building ORNAS brand assets → {output}")
    typer.echo(f"   Canvas: {canvas}px | Power: {power} | Thickness: {thickness}px")

    result = gen.generate_all(output)
    total = sum(len(v) for v in result.values())
    typer.echo(f"✓  Generated {total} files across {len(result)} categories.")
    for cat, paths in result.items():
        typer.echo(f"   {cat}: {len(paths)} files")


@app.command()
def svg(
    output: Annotated[Path, typer.Option("--output", "-o", help="Output directory")] = Path("./svg_output"),
    power: Annotated[float, typer.Option("--power")] = 4.0,
    thickness: Annotated[float, typer.Option("--thickness")] = 54.0,
) -> None:
    """Generate SVG files for all color schemes."""
    config = LogoConfig(squircle_power=power, body_thickness=thickness)
    gen = BrandGenerator(config)
    paths = gen.generate_svgs(output)
    typer.echo(f"✓  Generated {len(paths)} SVG files in {output}")


@app.command()
def png(
    output: Annotated[Path, typer.Option("--output", "-o", help="Output directory")] = Path("./png_output"),
    sizes: Annotated[str, typer.Option("--sizes", "-s", help="Comma-separated sizes")] = "16,32,64,128,256,512",
    scheme: Annotated[str, typer.Option("--scheme", help="Color scheme name")] = "accent",
    power: Annotated[float, typer.Option("--power")] = 4.0,
    thickness: Annotated[float, typer.Option("--thickness")] = 54.0,
) -> None:
    """Generate PNG files at specified sizes."""
    size_list = tuple(int(s.strip()) for s in sizes.split(","))
    config = LogoConfig(squircle_power=power, body_thickness=thickness)
    gen = BrandGenerator(config)
    color_scheme = _resolve_scheme(scheme)
    paths = gen.generate_pngs(output, sizes=size_list, scheme=color_scheme)
    typer.echo(f"✓  Generated {len(paths)} PNG files in {output}")


@app.command()
def ico(
    output: Annotated[Path, typer.Option("--output", "-o", help="Output .ico path")] = Path("./icon.ico"),
    scheme: Annotated[str, typer.Option("--scheme")] = "accent",
) -> None:
    """Generate a multi-resolution .ico file."""
    config = LogoConfig()
    gen = BrandGenerator(config)
    color_scheme = _resolve_scheme(scheme)
    path = gen.generate_ico(output, scheme=color_scheme)
    typer.echo(f"✓  Generated {path}")


@app.command()
def tauri(
    output: Annotated[Path, typer.Option("--output", "-o", help="Tauri icons directory")] = Path("./src-tauri/icons"),
) -> None:
    """Generate Tauri-compatible icon set."""
    config = LogoConfig()
    gen = BrandGenerator(config)
    paths = gen.generate_tauri_icons(output)
    typer.echo(f"✓  Generated {len(paths)} Tauri icon files in {output}")


@app.command()
def preview(
    output: Annotated[Path, typer.Option("--output", "-o", help="Output directory")] = Path("./previews"),
) -> None:
    """Generate preview sheets for visual QA."""
    config = LogoConfig()
    gen = BrandGenerator(config)
    paths = gen.generate_previews(output)
    typer.echo(f"✓  Generated {len(paths)} preview sheets in {output}")


@app.command()
def sweep(
    param: Annotated[str, typer.Argument(help="Parameter name to sweep (e.g., squircle_power)")],
    values: Annotated[list[float], typer.Argument(help="Values to sweep through")],
    output: Annotated[Path, typer.Option("--output", "-o")] = Path("./sweep_output"),
    size: Annotated[int, typer.Option("--size")] = 256,
    scheme: Annotated[str, typer.Option("--scheme")] = "accent",
) -> None:
    """Generate a parameter sweep — one PNG per value."""
    config = LogoConfig()
    gen = BrandGenerator(config)
    color_scheme = _resolve_scheme(scheme)
    paths = gen.sweep(param, values, output, size=size, scheme=color_scheme)
    typer.echo(f"✓  Swept {param} across {len(values)} values → {output}")


@app.command()
def info() -> None:
    """Print the current logo configuration and geometry stats."""
    config = LogoConfig()
    logo = OrnasLogo(config)

    typer.echo("ORNAS Logo Configuration")
    typer.echo("=" * 40)
    typer.echo(f"  Canvas:           {config.canvas_size}px")
    typer.echo(f"  Center:           ({config.center_x:.1f}, {config.center_y:.1f})")
    typer.echo(f"  Ring outer:       {config.body_radius_x:.1f} × {config.body_radius_y:.1f}")
    typer.echo(f"  Ring inner:       {config.inner_radius_x:.1f} × {config.inner_radius_y:.1f}")
    typer.echo(f"  Wall thickness:   {config.body_thickness:.1f}px")
    typer.echo(f"  Squircle power:   {config.squircle_power}")
    typer.echo(f"  Ring top Y:       {config.ring_top_y:.1f}")
    typer.echo(f"  Bracket top Y:    {config.bracket_top_y:.1f}")
    typer.echo(f"  Handle top Y:     {config.handle_top_y:.1f}")
    typer.echo(f"  Handle width:     {config.handle_width:.1f}px")
    typer.echo(f"  Slot:             {config.slot_width:.1f} × {config.slot_height:.1f}px")
    typer.echo(f"  Export sizes:     {config.export_sizes}")
    typer.echo()
    typer.echo("Geometry Stats")
    typer.echo("-" * 40)
    typer.echo(f"  Ring area:        {logo.ring.area:.1f} px²")
    typer.echo(f"  Bracket area:     {logo.bracket.area:.1f} px²")
    typer.echo(f"  Ring valid:       {logo.ring.is_valid}")
    typer.echo(f"  Bracket valid:    {logo.bracket.is_valid}")
    typer.echo(f"  Logo bounds:      {logo.bounds}")


if __name__ == "__main__":
    app()
