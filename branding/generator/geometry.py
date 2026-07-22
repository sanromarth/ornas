"""
geometry.py — Pure Geometric Primitives
=========================================

Every function in this module is a **pure function**: it takes numeric
parameters and returns a ``shapely.geometry.Polygon``.  No side-effects,
no file I/O, no colors — just mathematics.

Primitives provided:
    • ``superellipse``      – Parametric superellipse curve → Polygon
    • ``superellipse_ring`` – Difference of two superellipses → ring
    • ``rounded_rectangle`` – Rectangle with circular corner arcs
    • ``clipboard_bracket`` – Full bracket assembly via boolean ops
    • ``polygon_to_svg_path`` – Convert any Polygon to an SVG <path> ``d`` attribute
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely.validation import make_valid


# ═══════════════════════════════════════════════════════════════════════════
# Superellipse
# ═══════════════════════════════════════════════════════════════════════════

def superellipse(
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    power: float = 4.0,
    resolution: int = 256,
) -> Polygon:
    """
    Generate a superellipse (squircle) as a Shapely Polygon.

    The superellipse is defined by the implicit equation::

        |x/rx|^n + |y/ry|^n = 1

    Parametric form::

        x(t) = rx · sgn(cos t) · |cos t|^(2/n)
        y(t) = ry · sgn(sin t) · |sin t|^(2/n)

    Parameters
    ----------
    cx, cy : float
        Center of the superellipse.
    rx, ry : float
        Semi-axes (half-width, half-height).
    power : float
        Exponent ``n``.  2 = ellipse, 4 = squircle, →∞ = rectangle.
    resolution : int
        Number of sample points around the curve.

    Returns
    -------
    Polygon
        A closed polygon approximating the superellipse.
    """
    if rx <= 0 or ry <= 0:
        raise ValueError(f"Radii must be positive: rx={rx}, ry={ry}")
    if power < 2.0:
        raise ValueError(f"Power must be >= 2.0: {power}")

    t: NDArray[np.float64] = np.linspace(0, 2 * np.pi, resolution, endpoint=False)
    cos_t = np.cos(t)
    sin_t = np.sin(t)

    exp = 2.0 / power
    x = cx + rx * np.sign(cos_t) * np.abs(cos_t) ** exp
    y = cy + ry * np.sign(sin_t) * np.abs(sin_t) ** exp

    coords = list(zip(x.tolist(), y.tolist()))
    return Polygon(coords)


def superellipse_ring(
    cx: float,
    cy: float,
    outer_rx: float,
    outer_ry: float,
    inner_rx: float,
    inner_ry: float,
    power: float = 4.0,
    resolution: int = 256,
) -> Polygon:
    """
    Generate a superellipse ring (the "O" shape).

    Constructed as the boolean difference: ``outer − inner``.

    Parameters
    ----------
    cx, cy : float
        Shared center of both superellipses.
    outer_rx, outer_ry : float
        Semi-axes of the outer boundary.
    inner_rx, inner_ry : float
        Semi-axes of the inner boundary (the counter / hole).
    power : float
        Superellipse exponent (shared by inner and outer).
    resolution : int
        Curve sampling density.

    Returns
    -------
    Polygon
        A ring-shaped polygon with a hole.
    """
    outer = superellipse(cx, cy, outer_rx, outer_ry, power, resolution)
    inner = superellipse(cx, cy, inner_rx, inner_ry, power, resolution)
    ring = outer.difference(inner)
    return make_valid(ring)


# ═══════════════════════════════════════════════════════════════════════════
# Rounded Rectangle
# ═══════════════════════════════════════════════════════════════════════════

def rounded_rectangle(
    x: float,
    y: float,
    width: float,
    height: float,
    radius: float = 0.0,
    resolution: int = 8,
) -> Polygon:
    """
    Generate a rectangle with uniformly rounded corners.

    Uses the Shapely buffer/unbuffer technique:
        1. Create a rectangle inset by ``radius`` on all sides.
        2. Buffer outward by ``radius`` with round join style.

    This produces exact quarter-circle arcs at each corner.

    Parameters
    ----------
    x, y : float
        Top-left corner of the bounding box.
    width, height : float
        Dimensions of the bounding box.
    radius : float
        Corner radius.  Clamped to ``min(width, height) / 2``.
    resolution : int
        Number of segments per quarter-circle arc.

    Returns
    -------
    Polygon
        A rounded rectangle.
    """
    if width <= 0 or height <= 0:
        raise ValueError(f"Dimensions must be positive: {width}×{height}")

    r = min(radius, width / 2, height / 2)
    r = max(r, 0.0)

    if r < 0.01:
        # No rounding needed — return a plain box.
        return box(x, y, x + width, y + height)

    # Create a box inset by r on all sides, then buffer back out.
    inner = box(x + r, y + r, x + width - r, y + height - r)
    return inner.buffer(r, resolution=resolution, join_style=1)  # 1 = round


# ═══════════════════════════════════════════════════════════════════════════
# Clipboard Bracket Assembly
# ═══════════════════════════════════════════════════════════════════════════

def clipboard_bracket(
    center_x: float,
    ring_top_y: float,
    bracket_width: float,
    bracket_height: float,
    bracket_overlap: float,
    leg_thickness: float,
    bracket_radius: float,
    handle_width: float,
    handle_height: float,
    handle_radius: float,
    slot_width: float,
    slot_height: float,
    slot_radius: float,
    inner_inset: float,
    inner_radius: float,
) -> Polygon:
    """
    Construct the clipboard bracket via boolean geometry operations.

    The bracket is an inverted-U frame with a handle tab extending upward
    from its top bar, and a small rounded-rectangle slot cut from the handle.

    Assembly steps
    ──────────────
    1. Build the bracket frame body (wide rectangle from leg to leg).
    2. Build the handle tab (narrower rectangle extending above).
    3. Union → outer profile.
    4. Build the inner cavity (extends below bracket to open the bottom).
    5. Build the handle slot (small rounded rect).
    6. Subtract cavity and slot from outer profile.

    Parameters
    ----------
    center_x : float
        Horizontal center (shared with the ring).
    ring_top_y : float
        Y coordinate of the top of the squircle ring.
    bracket_width : float
        Full width of the bracket frame (usually matches ring diameter).
    bracket_height : float
        Height of the bracket frame (excluding handle).
    bracket_overlap : float
        How far the bracket legs extend below ring_top_y.
    leg_thickness : float
        Width of each vertical leg.
    bracket_radius : float
        Corner radius of the outer bracket frame.
    handle_width : float
        Width of the handle tab.
    handle_height : float
        How far the handle extends above the bracket frame.
    handle_radius : float
        Corner radius of the handle tab.
    slot_width, slot_height : float
        Dimensions of the handle slot cutout.
    slot_radius : float
        Corner radius of the slot cutout.
    inner_inset : float
        Inset distance from outer edges to the inner cavity boundary.
    inner_radius : float
        Corner radius of the inner cavity.

    Returns
    -------
    Polygon
        The complete bracket as a single valid polygon.
    """
    half_w = bracket_width / 2

    # ── Bracket frame body ────────────────────────────────────────────
    bracket_bottom = ring_top_y + bracket_overlap
    bracket_top = bracket_bottom - bracket_height
    body = rounded_rectangle(
        x=center_x - half_w,
        y=bracket_top,
        width=bracket_width,
        height=bracket_height,
        radius=bracket_radius,
    )

    # ── Handle tab ────────────────────────────────────────────────────
    # Overlaps with the top of the body so the union merges cleanly.
    handle_overlap = bracket_radius  # Ensure clean merge at junction
    handle = rounded_rectangle(
        x=center_x - handle_width / 2,
        y=bracket_top - handle_height + handle_overlap,
        width=handle_width,
        height=handle_height + handle_overlap,
        radius=handle_radius,
    )

    # ── Outer profile (union of body + handle) ────────────────────────
    outer = unary_union([body, handle])

    # ── Inner cavity (opens the bottom of the bracket) ────────────────
    # By extending the cavity well below bracket_bottom, the bottom
    # of the bracket frame is removed, creating the inverted-U shape.
    cavity_x = center_x - half_w + inner_inset
    cavity_width = bracket_width - 2 * inner_inset
    cavity_top = bracket_top + inner_inset
    cavity_height = (bracket_bottom - cavity_top) + 200  # extend past bottom
    inner_cavity = rounded_rectangle(
        x=cavity_x,
        y=cavity_top,
        width=cavity_width,
        height=cavity_height,
        radius=inner_radius,
    )

    # ── Handle slot cutout ────────────────────────────────────────────
    handle_center_y = bracket_top - handle_height / 2 + handle_overlap / 2
    slot = rounded_rectangle(
        x=center_x - slot_width / 2,
        y=handle_center_y - slot_height / 2,
        width=slot_width,
        height=slot_height,
        radius=slot_radius,
    )

    # ── Final boolean: outer − cavity − slot ──────────────────────────
    result = outer.difference(inner_cavity).difference(slot)
    return make_valid(result)


# ═══════════════════════════════════════════════════════════════════════════
# SVG Path Conversion
# ═══════════════════════════════════════════════════════════════════════════

def _ring_to_path(coords: list[tuple[float, float]], precision: int = 2) -> str:
    """Convert a coordinate ring to an SVG sub-path (M … L … Z)."""
    if not coords:
        return ""
    parts: list[str] = []
    x0, y0 = coords[0]
    parts.append(f"M {x0:.{precision}f} {y0:.{precision}f}")
    for x, y in coords[1:]:
        parts.append(f"L {x:.{precision}f} {y:.{precision}f}")
    parts.append("Z")
    return " ".join(parts)


def polygon_to_svg_path(geom: Polygon, precision: int = 2) -> str:
    """
    Convert a Shapely Polygon (with optional holes) to an SVG ``d`` attribute.

    The exterior ring is traced clockwise and any interior rings (holes)
    are traced counter-clockwise, compatible with the ``evenodd`` fill rule.

    Parameters
    ----------
    geom : Polygon
        A valid Shapely Polygon (may contain interior rings).
    precision : int
        Decimal places for coordinate rounding.

    Returns
    -------
    str
        A complete SVG path ``d`` attribute string.
    """
    from shapely.geometry import MultiPolygon

    paths: list[str] = []

    if isinstance(geom, MultiPolygon):
        for poly in geom.geoms:
            paths.append(polygon_to_svg_path(poly, precision))
        return " ".join(paths)

    # Exterior ring
    exterior_coords = list(geom.exterior.coords)
    paths.append(_ring_to_path(exterior_coords, precision))

    # Interior rings (holes)
    for interior in geom.interiors:
        hole_coords = list(interior.coords)
        paths.append(_ring_to_path(hole_coords, precision))

    return " ".join(paths)
