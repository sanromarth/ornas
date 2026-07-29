# ORNAS UI Style Guide

This document outlines the standard UI tokens, spacing, and interaction patterns for ORNAS. This ensures that any future additions seamlessly blend into the application.

## Typography

ORNAS uses a carefully selected font stack:

- **Sans Serif (`font-sans`)**: `Inter` — Used for all general UI, lists, labels, and settings.
- **Monospace (`font-mono`)**: `JetBrains Mono` — Used for code previews, shortcuts (`<kbd>`), and log output.
- **Display (`font-display`)**: `Outfit` — Reserved for hero titles and marketing assets (used sparingly).

**Scales:**
- `text-[10px]` & `text-[11px]`: Used for meta-information (timestamps, sizes, inline badges).
- `text-xs` (`12px`): Used for secondary labels, small buttons.
- `text-[13px]`: The **default** reading size for list items, standard labels, and inputs.
- `text-sm` (`14px`): Used for primary input fields (e.g., Search Bar).

## Spacing

ORNAS strictly follows the 4px Tailwind spacing scale. Do not use arbitrary values (`-[1.5]`) in standard UI components unless aligning optical centers.

- `spacing-1` (4px)
- `spacing-2` (8px)
- `spacing-3` (12px)
- `spacing-4` (16px)
- `spacing-6` (24px)

*Example Usage:*
- Section gaps: `space-y-6`
- Component internal padding: `p-2` or `px-3 py-1.5`

## Interactive Elements

### Buttons
All buttons in ORNAS use the `Button` component, standardising size and focus states.

- **Small (`sm`)**: `h-7 px-3 text-xs rounded-md`
- **Medium (`md`)**: `h-9 px-4 text-sm rounded-md`

### Focus States
ORNAS prioritizes accessibility with a high-contrast focus ring that matches native macOS behaviors.

**Standard token:** 
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1`

*(Use `focus-visible:ring-inset` for edge-to-edge components like the SearchBar where an offset ring would be clipped).*

## Semantic Colors

Always use CSS variable tokens (e.g., `text-text-primary`, `bg-surface`) instead of hardcoded hex values to support dynamic theming.

- **Backgrounds:** `bg-background` (app root), `bg-surface` (panels), `bg-elevated` (dropdowns/tooltips).
- **Text:** `text-text-primary` (main), `text-text-secondary` (subtitles), `text-text-tertiary` (metadata).
- **Accents:** `text-primary`, `bg-primary/20` (selections), `bg-selection` (active list item).

---
*Maintain this file as new components are added to the system.*
