"""
logo.py — Logo Assembly
========================

Assembles the ORNAS logo from parametric geometry primitives.

The ``OrnasLogo`` class takes a ``LogoConfig``, builds each geometric
element via ``geometry.py``, and exposes the final composed shapes for
export.  It also produces SVG markup via ``svgwrite``.

This module never writes files — that's the job of ``export.py``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import svgwrite
from shapely.geometry import Polygon

from .config import ColorScheme, LogoConfig, SCHEME_ACCENT
from .geometry import (
    clipboard_bracket,
    polygon_to_svg_path,
    superellipse_ring,
)


@dataclass
class OrnasLogo:
    """
    A fully-assembled ORNAS logo instance.

    Usage::

        config = LogoConfig()
        logo = OrnasLogo(config)
        logo.build()

        # Access individual shapes
        print(logo.ring.area)
        print(logo.bracket.area)

        # Generate SVG string
        svg_str = logo.to_svg(scheme=SCHEME_ACCENT)
    """

    config: LogoConfig
    ring: Polygon = field(init=False, repr=False)
    bracket: Polygon = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.build()

    def build(self) -> None:
        """
        Compute all logo geometry from the current config.

        This rebuilds both the squircle ring and the clipboard bracket
        from scratch using only the values in ``self.config``.
        """
        cfg = self.config

        # ── Build the squircle ring ("O" monogram) ─────────────────────
        self.ring = superellipse_ring(
            cx=cfg.center_x,
            cy=cfg.center_y,
            outer_rx=cfg.body_radius_x,
            outer_ry=cfg.body_radius_y,
            inner_rx=cfg.inner_radius_x,
            inner_ry=cfg.inner_radius_y,
            power=cfg.squircle_power,
            resolution=cfg.curve_resolution,
        )

        # ── Build the clipboard bracket ────────────────────────────────
        self.bracket = clipboard_bracket(
            center_x=cfg.center_x,
            ring_top_y=cfg.ring_top_y,
            bracket_width=cfg.bracket_width,
            bracket_height=cfg.bracket_height,
            bracket_overlap=cfg.bracket_overlap,
            leg_thickness=cfg.bracket_leg_thickness,
            bracket_radius=cfg.bracket_corner_radius,
            handle_width=cfg.handle_width,
            handle_height=cfg.handle_height,
            handle_radius=cfg.handle_corner_radius,
            slot_width=cfg.slot_width,
            slot_height=cfg.slot_height,
            slot_radius=cfg.slot_corner_radius,
            inner_inset=cfg.inner_bracket_inset,
            inner_radius=cfg.inner_bracket_corner_radius,
        )

    @property
    def shapes(self) -> dict[str, Polygon]:
        """Return all named shapes as a dictionary."""
        return {
            "ring": self.ring,
            "bracket": self.bracket,
        }

    @property
    def bounds(self) -> tuple[float, float, float, float]:
        """Bounding box of the entire logo (minx, miny, maxx, maxy)."""
        from shapely.ops import unary_union
        combined = unary_union([self.ring, self.bracket])
        return combined.bounds

    def to_svg(
        self,
        scheme: ColorScheme = SCHEME_ACCENT,
        *,
        padding: float = 0.0,
    ) -> str:
        """
        Render the logo as an SVG string.

        Parameters
        ----------
        scheme : ColorScheme
            Which color variant to render.
        padding : float
            Extra padding around the canvas (in canvas units).

        Returns
        -------
        str
            Complete SVG document as a string.
        """
        cfg = self.config
        size = cfg.canvas_size + 2 * padding

        dwg = svgwrite.Drawing(
            size=(f"{size}", f"{size}"),
            viewBox=f"{-padding} {-padding} {size} {size}",
        )
        dwg.attribs["xmlns"] = "http://www.w3.org/2000/svg"

        # Optional background
        if scheme.background is not None:
            dwg.add(dwg.rect(
                insert=(f"{-padding}", f"{-padding}"),
                size=(f"{size}", f"{size}"),
                fill=scheme.background,
            ))

        # Ring path
        ring_path = polygon_to_svg_path(self.ring)
        dwg.add(dwg.path(
            d=ring_path,
            fill=scheme.body_fill,
            fill_rule="evenodd",
        ))

        # Bracket path
        bracket_path = polygon_to_svg_path(self.bracket)
        dwg.add(dwg.path(
            d=bracket_path,
            fill=scheme.bracket_fill,
            fill_rule="evenodd",
        ))

        return dwg.tostring()

    def to_svg_combined(
        self,
        fill: str = "#000000",
        *,
        padding: float = 0.0,
    ) -> str:
        """
        Render the logo as a single combined SVG path (monochrome).

        Useful for favicons and system tray icons where the entire
        logo must be a single shape.

        Parameters
        ----------
        fill : str
            Fill color for the combined shape.
        padding : float
            Extra padding around the canvas.

        Returns
        -------
        str
            Complete SVG document string.
        """
        from shapely.ops import unary_union

        cfg = self.config
        size = cfg.canvas_size + 2 * padding
        combined = unary_union([self.ring, self.bracket])

        dwg = svgwrite.Drawing(
            size=(f"{size}", f"{size}"),
            viewBox=f"{-padding} {-padding} {size} {size}",
        )
        dwg.attribs["xmlns"] = "http://www.w3.org/2000/svg"

        path_d = polygon_to_svg_path(combined)
        dwg.add(dwg.path(d=path_d, fill=fill, fill_rule="evenodd"))

        return dwg.tostring()

    def __repr__(self) -> str:
        return (
            f"OrnasLogo("
            f"canvas={self.config.canvas_size}, "
            f"ring_area={self.ring.area:.0f}, "
            f"bracket_area={self.bracket.area:.0f})"
        )
