"""
generator.py — Batch Variant & Asset Generation
=================================================

Orchestrates the full branding pipeline:
    • Build logo from config
    • Export all color schemes as SVG
    • Export all sizes as PNG
    • Generate ICO / ICNS bundles
    • Generate Tauri-compatible icon sets
    • Produce preview sheets

This is the single entry point for regenerating the entire brand suite.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .config import (
    ALL_SCHEMES,
    ColorScheme,
    LogoConfig,
    SCHEME_ACCENT,
    SCHEME_DARK,
    SCHEME_LIGHT,
    SCHEME_MONOCHROME,
)
from .export import (
    export_ico,
    export_png,
    export_png_combined,
    export_sizes,
    export_svg,
    export_svg_combined,
)
from .logo import OrnasLogo
from .preview import (
    generate_context_sheet,
    generate_size_sheet,
    generate_variant_sheet,
)


@dataclass
class BrandGenerator:
    """
    Procedural brand asset generator for ORNAS.

    Given a ``LogoConfig``, this class can regenerate every icon,
    favicon, app asset, and preview sheet from a single source of truth.

    Usage::

        gen = BrandGenerator()
        gen.generate_all(Path("./output"))

    Or selectively::

        gen = BrandGenerator()
        gen.generate_svgs(Path("./output/svg"))
        gen.generate_pngs(Path("./output/png"))
    """

    config: LogoConfig = field(default_factory=LogoConfig)
    logo: OrnasLogo = field(init=False, repr=False)
    _manifest: list[dict[str, Any]] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        self.logo = OrnasLogo(self.config)

    def _record(self, category: str, path: Path, **meta: Any) -> None:
        """Track every generated file for the manifest."""
        self._manifest.append({
            "category": category,
            "path": str(path),
            "name": path.name,
            **meta,
        })

    # ── SVG Exports ───────────────────────────────────────────────────

    def generate_svgs(self, output_dir: Path) -> list[Path]:
        """
        Generate SVG files for every color scheme.

        Produces both dual-color and monochrome single-path variants.

        Returns
        -------
        list[Path]
            All written SVG paths.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        written: list[Path] = []

        for scheme in ALL_SCHEMES:
            p = export_svg(self.logo, output_dir / f"icon-{scheme.name}.svg", scheme)
            self._record("svg", p, scheme=scheme.name)
            written.append(p)

        # Combined monochrome variants
        for name, fill in [("black", "#000000"), ("white", "#FFFFFF")]:
            p = export_svg_combined(self.logo, output_dir / f"icon-mono-{name}.svg", fill)
            self._record("svg", p, scheme=f"mono-{name}")
            written.append(p)

        return written

    # ── PNG Exports ───────────────────────────────────────────────────

    def generate_pngs(
        self,
        output_dir: Path,
        sizes: tuple[int, ...] | None = None,
        scheme: ColorScheme = SCHEME_ACCENT,
    ) -> list[Path]:
        """
        Generate PNGs at all configured export sizes.

        Parameters
        ----------
        output_dir : Path
            Directory to write into.
        sizes : tuple[int, ...] | None
            Override sizes (defaults to ``config.export_sizes``).
        scheme : ColorScheme
            Color variant to use.

        Returns
        -------
        list[Path]
            All written PNG paths.
        """
        sizes = sizes or self.config.export_sizes
        written = export_sizes(self.logo, output_dir, sizes, scheme, prefix="icon")
        for p in written:
            self._record("png", p, scheme=scheme.name)
        return written

    # ── ICO Export ────────────────────────────────────────────────────

    def generate_ico(
        self,
        output_path: Path,
        scheme: ColorScheme = SCHEME_ACCENT,
    ) -> Path:
        """Generate a multi-resolution .ico file."""
        p = export_ico(self.logo, output_path, scheme=scheme)
        self._record("ico", p, scheme=scheme.name)
        return p

    # ── Tauri Icons ──────────────────────────────────────────────────

    def generate_tauri_icons(self, output_dir: Path) -> list[Path]:
        """
        Generate the icon set expected by Tauri's build system.

        Produces:
            • 32x32.png, 128x128.png, 128x128@2x.png, icon.png (512)
            • icon.ico (multi-res)

        Parameters
        ----------
        output_dir : Path
            The ``src-tauri/icons/`` directory.

        Returns
        -------
        list[Path]
            All written paths.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        written: list[Path] = []

        scheme = SCHEME_ACCENT

        tauri_pngs = {
            "32x32.png": 32,
            "128x128.png": 128,
            "128x128@2x.png": 256,
            "icon.png": 512,
        }

        for name, size in tauri_pngs.items():
            p = export_png(self.logo, output_dir / name, size, scheme)
            self._record("tauri", p)
            written.append(p)

        ico_path = self.generate_ico(output_dir / "icon.ico", scheme)
        written.append(ico_path)

        return written

    # ── Favicon ──────────────────────────────────────────────────────

    def generate_favicon(self, output_dir: Path) -> list[Path]:
        """
        Generate web favicons (SVG + ICO + PNG touch icon).

        Returns
        -------
        list[Path]
            Written paths for favicon.svg, favicon.ico, apple-touch-icon.png.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        written: list[Path] = []

        # SVG favicon
        p = export_svg(self.logo, output_dir / "favicon.svg", SCHEME_ACCENT)
        self._record("favicon", p)
        written.append(p)

        # ICO favicon (16, 32, 48)
        p = export_ico(self.logo, output_dir / "favicon.ico",
                        sizes=(16, 32, 48), scheme=SCHEME_ACCENT)
        self._record("favicon", p)
        written.append(p)

        # Apple touch icon
        p = export_png(self.logo, output_dir / "apple-touch-icon.png", 180, SCHEME_ACCENT)
        self._record("favicon", p)
        written.append(p)

        return written

    # ── Preview Sheets ───────────────────────────────────────────────

    def generate_previews(self, output_dir: Path) -> list[Path]:
        """
        Generate all preview sheets for QA review.

        Returns
        -------
        list[Path]
            Written preview sheet paths.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        written: list[Path] = []

        p = generate_size_sheet(self.logo, output_dir / "preview-sizes.png")
        self._record("preview", p)
        written.append(p)

        p = generate_variant_sheet(self.logo, output_dir / "preview-variants.png")
        self._record("preview", p)
        written.append(p)

        p = generate_context_sheet(self.logo, output_dir / "preview-context.png")
        self._record("preview", p)
        written.append(p)

        return written

    # ── Full Pipeline ────────────────────────────────────────────────

    def generate_all(self, output_dir: Path) -> dict[str, list[Path]]:
        """
        Execute the complete brand generation pipeline.

        Creates subdirectories: ``svg/``, ``png/``, ``ico/``, ``preview/``,
        ``favicon/``, ``tauri/``.

        Parameters
        ----------
        output_dir : Path
            Root output directory.

        Returns
        -------
        dict[str, list[Path]]
            Categorized mapping of all written files.
        """
        output_dir = Path(output_dir)
        self._manifest.clear()

        result: dict[str, list[Path]] = {}
        result["svg"] = self.generate_svgs(output_dir / "svg")
        result["png"] = self.generate_pngs(output_dir / "png")
        result["ico"] = [self.generate_ico(output_dir / "ico" / "icon.ico")]
        result["tauri"] = self.generate_tauri_icons(output_dir / "tauri")
        result["favicon"] = self.generate_favicon(output_dir / "favicon")
        result["preview"] = self.generate_previews(output_dir / "preview")

        # Write manifest
        manifest_path = output_dir / "manifest.json"
        manifest_path.write_text(
            json.dumps(self._manifest, indent=2),
            encoding="utf-8",
        )
        result["manifest"] = [manifest_path]

        return result

    # ── Parameter Sweep ──────────────────────────────────────────────

    def sweep(
        self,
        param_name: str,
        values: list[float],
        output_dir: Path,
        size: int = 256,
        scheme: ColorScheme = SCHEME_ACCENT,
    ) -> list[Path]:
        """
        Generate a parameter sweep — one PNG per value.

        Useful for exploring how a single parameter (e.g., squircle_power)
        affects the logo appearance.

        Parameters
        ----------
        param_name : str
            Name of a ``LogoConfig`` field to vary.
        values : list[float]
            Values to sweep through.
        output_dir : Path
            Output directory.
        size : int
            Render size for each variant.
        scheme : ColorScheme
            Color variant.

        Returns
        -------
        list[Path]
            Written PNG paths.
        """
        from dataclasses import asdict

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        written: list[Path] = []

        base = asdict(self.config)
        # Remove non-serializable fields
        base.pop("export_sizes", None)

        for val in values:
            override = {**base, param_name: val, "export_sizes": self.config.export_sizes}
            variant_config = LogoConfig(**override)
            variant_logo = OrnasLogo(variant_config)

            label = f"{param_name}_{val:.2f}".replace(".", "_")
            p = export_png(variant_logo, output_dir / f"{label}.png", size, scheme)
            self._record("sweep", p, param=param_name, value=val)
            written.append(p)

        return written
