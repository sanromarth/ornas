# ORNAS Brand Guidelines

This document outlines the official usage guidelines for the ORNAS Brand v1.0.

## Brand Philosophy
ORNAS ("Never Lose a Copy") is a modern, open-source desktop clipboard manager focused on history, organization, speed, privacy, and reliability. The visual identity reflects these core pillars through precision geometry, avoiding literal metaphors in favor of an abstract, premium aesthetic.

## Logo Meaning & Geometry
The logo represents:
- **Memory & Archival:** The solid structure implies a vault or secure storage.
- **Continuity:** The unbroken "O" shape (squircle) signifies continuous history.
- **Utility:** The subtle, integrated clipboard bracket at the top nods to the application's core function without resorting to generic office-supply iconography.

The logo geometry is strictly parametric, built entirely through mathematical boolean operations rather than freehand illustration. The core shape is a superellipse (`n=4.0`) perfectly balanced against a rounded-rectangle bracket.

### Version 1.0 Geometry Constraints
- **Squircle Power:** 4.0
- **Body Radius:** 154.0
- **Wall Thickness:** 54.0
- **Bracket Height:** 65.0
- **Bracket Overlap:** 14.0

*Note: These proportions are strictly frozen. Do not manually stretch, alter, or "optically correct" the SVG paths.*

## Color Palette

The official color palette is minimalistic to ensure the geometry speaks for itself.

| Role | Color | Hex Code | Usage |
|---|---|---|---|
| **Primary Accent** | Cyan | `#00D4FF` | Main application icon, marketing hero images |
| **Monochrome Light** | White | `#FFFFFF` | For use on dark backgrounds (Dark Mode) |
| **Monochrome Dark** | Very Dark Blue | `#0D0D1A` | For use on light backgrounds (Light Mode) |

Do **not** use gradients, drop shadows, or inner glows on the logo itself.

## Usage Guidelines

### 1. Minimum Size & Scaling
The logo was mathematically optimized to retain clarity down to a 16×16 favicon.
- **Favicon Minimum:** 16×16 px
- **UI Minimum:** 24×24 px
- **Standard Desktop:** 128×128 px

### 2. Safe Area (Clear Space)
Always maintain a minimum clear space around the logo equal to the height of the handle (approx. 10% of the total canvas size). Do not let typography, borders, or other graphical elements encroach on this space.

### 3. Background Contrast
- When placing the Accent (`#00D4FF`) logo on a background, ensure a contrast ratio of at least 4.5:1. 
- The optimal background for the Accent logo is very dark gray/blue (e.g., `#0D0D1A`).
- When placing on a light background, use the Dark Monochrome variant, or ensure the background is dark enough to support the Accent.

### 4. Do's and Don'ts

**Do:**
- Use the provided SVG files for all UI and web implementations.
- Use the generated `.ico` and `Tauri` bundles for desktop application builds.
- Keep the logo single-color (monochrome or accent).

**Don't:**
- ✘ Stretch, compress, or alter the aspect ratio.
- ✘ Add gradients, 3D effects, shadows, or outlines.
- ✘ Rotate the logo.
- ✘ Change the color to anything outside the official palette.
- ✘ Re-draw the shape manually.

## Exported Assets

All production assets are located in `branding/brand_output/`.

- `svg/`: Scalable vector graphics (Primary, Light, Dark). Always prefer these for web.
- `png/`: Pre-rasterized assets from 16px to 1024px.
- `tauri/`: Application icons specifically packaged for the Tauri build process (`icon.png`, `icon.icns`, `icon.ico`).
- `favicon/`: Web-ready favicons (`favicon.ico`, `apple-touch-icon.png`).

To regenerate these assets, use the procedural generator:
```bash
cd branding
python -m generator build --output ./brand_output
```
