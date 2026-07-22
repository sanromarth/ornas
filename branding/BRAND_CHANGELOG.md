# ORNAS Brand Changelog

## Pre-Beta Migration (Current)

**Migrated from:** Legacy Clipboard Icon
**Migrated to:** Capture Mark v2

### Reasons for Migration

The legacy ORNAS logo was a literal, detailed illustration of a physical clipboard. 
- **Complexity:** It contained hundreds of path data points to render the superellipse body and the top clip/flange piece. 
- **Scalability:** Due to the dense geometry, the icon became muddy and illegible at small sizes (e.g., 16px favicons).
- **Unoriginality:** The literal clipboard silhouette is a generic concept used by countless utility applications. It lacked a unique, ownable brand identity.

### The New Brand Identity

The new **Capture Mark v2** resolves all previous issues:
- **Clean Geometry:** Built from only 3 simple SVG path primitives (an open 270° arc and two bezier flanges).
- **Extreme Scalability:** Renders crisply at 1024px for macOS Retina displays and remains perfectly legible down to 16px for favicons.
- **Conceptual Depth:** Replaces the literal clipboard with an abstract "capture" gesture — an open circle drawing content inward.
- **Production Ready:** Includes automated pipeline generation for filled digital variants and single-stroke outline variants for physical merchandise.

### Automated Asset Pipeline

Introduced `npm run generate:icons` (Node.js + `sharp` + `png-to-ico`), which autonomously builds the entire 81-asset suite from the master SVG files to guarantee consistency across platforms (Windows `.ico`, macOS `.icns`, Linux PNGs, Web SVG).
