"""
ORNAS Procedural Brand Generator
=================================

A CAD-grade parametric logo generation system.
Every coordinate is computed from parameters — no hardcoded SVG paths.

Modules:
    config      — Logo parameters and color schemes
    geometry    — Pure geometric primitives (superellipse, rounded rect, bracket)
    logo        — Logo assembly from geometry primitives
    export      — SVG / PNG / ICO export pipeline
    generator   — Batch variant and asset generation
    preview     — Preview sheet composition
    cli         — Command-line interface
"""

__version__ = "1.0.0"
