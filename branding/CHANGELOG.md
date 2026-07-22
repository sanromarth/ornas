# ORNAS Branding Changelog

All notable changes to the ORNAS Brand identity will be documented in this file.

## [v1.0.0] - 2026-07-21
### Added
- Initial release of ORNAS Brand v1.0.
- `generator/` — Procedural CAD-grade brand generation engine in Python (Shapely + svgwrite).
- `brand_output/` — Full suite of production assets (SVG, PNG, ICO, Favicon, Tauri bundles).
- Parameter sweeps and multi-size preview generators.
- `BRAND.md` guidelines.

### Fixed
- **Geometry Freeze**: Executed a rigorous 3-round geometric optimization evaluating 95 procedural variants.
- Final mathematical optimum selected and locked:
  - `body_radius_x`: 154.0
  - `body_radius_y`: 154.0
  - `bracket_overlap`: 14.0
  - All other parameters conform to the v1.0 baseline.
- Ensured perfect favicon readability (edge-to-fill retention) down to 16×16 px.

### Removed
- Archived all experimental design explorations, sketches, and iterative scripts into `archive/`.
