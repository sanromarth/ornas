"""
config.py — Logo Parameters & Color Schemes
=============================================

Every dimension of the ORNAS logo is defined here as a parameter.
Changing any value regenerates the entire brand from scratch.

The reference canvas is 512×512. All coordinates are defined at this
reference size and scaled proportionally for other export sizes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Self


@dataclass(frozen=True)
class ColorScheme:
    """A named color variant of the logo."""

    name: str
    body_fill: str          # Color for the squircle O ring
    bracket_fill: str       # Color for the clipboard bracket
    background: str | None  # None = transparent

    def __repr__(self) -> str:
        return f"ColorScheme({self.name!r})"


# ── Pre-defined color schemes ──────────────────────────────────────────────

SCHEME_ACCENT = ColorScheme(
    name="accent",
    body_fill="#FFFFFF",
    bracket_fill="#00D4FF",
    background=None,
)

SCHEME_DARK = ColorScheme(
    name="dark",
    body_fill="#FFFFFF",
    bracket_fill="#FFFFFF",
    background=None,
)

SCHEME_LIGHT = ColorScheme(
    name="light",
    body_fill="#000000",
    bracket_fill="#000000",
    background=None,
)

SCHEME_MONOCHROME = ColorScheme(
    name="monochrome",
    body_fill="#000000",
    bracket_fill="#000000",
    background=None,
)

ALL_SCHEMES: list[ColorScheme] = [
    SCHEME_ACCENT,
    SCHEME_DARK,
    SCHEME_LIGHT,
    SCHEME_MONOCHROME,
]


@dataclass(frozen=True)
class LogoConfig:
    """
    Complete parametric definition of the ORNAS logo.

    All measurements are in pixels at the **reference canvas size** (512×512).
    The generator scales every value proportionally when exporting to other sizes.

    Architecture
    ────────────
    The logo is composed of two geometric elements:

        1. Squircle Ring  — A superellipse "O" representing the brand monogram.
        2. Clipboard Bracket — A handle+frame integrated into the top of the ring,
           representing the clipboard utility.

    Tuning Guide
    ─────────────
    • Increase ``squircle_power`` toward 6–8 for a more rectangular feel.
    • Decrease toward 2.5–3 for a rounder, softer shape.
    • ``body_thickness`` controls the ring wall weight.
    • ``bracket_overlap`` controls how deeply the bracket merges into the ring.
    """

    # ── Canvas ─────────────────────────────────────────────────────────────
    canvas_size: int = 512

    # ── Squircle Ring ("O") ────────────────────────────────────────────────
    body_center_y_ratio: float = 0.605
    """Vertical center of the ring as a ratio of canvas_size (>0.5 = shifted down)."""

    body_radius_x: float = 154.0
    """Horizontal half-extent of the outer superellipse."""

    body_radius_y: float = 154.0
    """Vertical half-extent of the outer superellipse."""

    body_thickness: float = 54.0
    """Wall thickness of the ring (outer radius minus inner radius)."""

    squircle_power: float = 4.0
    """Superellipse exponent.  2 = ellipse, 4 = squircle, ∞ = rectangle."""

    curve_resolution: int = 256
    """Number of sample points per superellipse curve."""

    # ── Clipboard Bracket ──────────────────────────────────────────────────
    bracket_height: float = 65.0
    """Total height of the bracket frame (excluding handle)."""

    bracket_overlap: float = 14.0
    """Pixels the bracket legs extend below the top of the squircle ring."""

    bracket_leg_thickness: float = 26.0
    """Width of each vertical bracket leg."""

    bracket_corner_radius: float = 20.0
    """Corner radius on the outer bracket frame."""

    # ── Handle (tab extending above bracket) ───────────────────────────────
    handle_width: float = 100.0
    """Total width of the handle tab."""

    handle_height: float = 45.0
    """How far the handle extends above the bracket top bar."""

    handle_corner_radius: float = 20.0
    """Corner radius on the handle tab."""

    # ── Handle Slot (cutout inside the handle) ─────────────────────────────
    slot_width: float = 48.0
    """Width of the rounded-rectangle slot cut from the handle."""

    slot_height: float = 16.0
    """Height of the slot cutout."""

    slot_corner_radius: float = 8.0
    """Corner radius of the slot cutout."""

    # ── Inner Bracket Cavity ───────────────────────────────────────────────
    inner_bracket_inset: float = 26.0
    """How far the inner cavity is inset from the outer bracket edges."""

    inner_bracket_corner_radius: float = 15.0
    """Corner radius of the inner cavity."""

    # ── Export Sizes ───────────────────────────────────────────────────────
    export_sizes: tuple[int, ...] = (16, 20, 24, 32, 48, 64, 128, 256, 512, 1024)

    # ── Derived Properties ─────────────────────────────────────────────────

    @property
    def center_x(self) -> float:
        """Horizontal center of the ring (always canvas midpoint)."""
        return self.canvas_size / 2.0

    @property
    def center_y(self) -> float:
        """Vertical center of the ring, shifted down for optical balance."""
        return self.canvas_size * self.body_center_y_ratio

    @property
    def inner_radius_x(self) -> float:
        """Horizontal half-extent of the inner superellipse (counter)."""
        return self.body_radius_x - self.body_thickness

    @property
    def inner_radius_y(self) -> float:
        """Vertical half-extent of the inner superellipse (counter)."""
        return self.body_radius_y - self.body_thickness

    @property
    def ring_top_y(self) -> float:
        """Y coordinate of the topmost point of the outer squircle."""
        return self.center_y - self.body_radius_y

    @property
    def bracket_width(self) -> float:
        """Total width of the bracket frame (matches ring outer diameter)."""
        return 2.0 * self.body_radius_x

    @property
    def bracket_top_y(self) -> float:
        """Y coordinate of the top edge of the bracket frame."""
        return self.ring_top_y + self.bracket_overlap - self.bracket_height

    @property
    def bracket_bottom_y(self) -> float:
        """Y coordinate where the bracket legs terminate (overlaps ring)."""
        return self.ring_top_y + self.bracket_overlap

    @property
    def handle_top_y(self) -> float:
        """Y coordinate of the topmost point of the handle tab."""
        return self.bracket_top_y - self.handle_height

    @property
    def scale_factor(self) -> float:
        """Ratio of current canvas to the reference 512px canvas."""
        return self.canvas_size / 512.0

    def at_size(self, size: int) -> Self:
        """Return a new config scaled to a different canvas size."""
        ratio = size / self.canvas_size
        return LogoConfig(
            canvas_size=size,
            body_center_y_ratio=self.body_center_y_ratio,
            body_radius_x=self.body_radius_x * ratio,
            body_radius_y=self.body_radius_y * ratio,
            body_thickness=self.body_thickness * ratio,
            squircle_power=self.squircle_power,
            curve_resolution=max(32, int(self.curve_resolution * ratio)),
            bracket_height=self.bracket_height * ratio,
            bracket_overlap=self.bracket_overlap * ratio,
            bracket_leg_thickness=self.bracket_leg_thickness * ratio,
            bracket_corner_radius=self.bracket_corner_radius * ratio,
            handle_width=self.handle_width * ratio,
            handle_height=self.handle_height * ratio,
            handle_corner_radius=self.handle_corner_radius * ratio,
            slot_width=self.slot_width * ratio,
            slot_height=self.slot_height * ratio,
            slot_corner_radius=self.slot_corner_radius * ratio,
            inner_bracket_inset=self.inner_bracket_inset * ratio,
            inner_bracket_corner_radius=self.inner_bracket_corner_radius * ratio,
            export_sizes=self.export_sizes,
        )
