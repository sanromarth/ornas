# ORNAS — Spacing & Layout System

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

ORNAS relies on a dense desktop grid. The layout must feel structured and predictable without wasting horizontal real estate.

## 1. The 8-Point Grid
The foundational grid is based on 8px increments. A 4px sub-grid is used exclusively for micro-adjustments inside components.

### Tailwind Mapping
- `1` = 4px (micro)
- `2` = 8px (standard gap)
- `3` = 12px
- `4` = 16px (component padding)
- `6` = 24px (layout margin)
- `8` = 32px (major section break)

## 2. Layout Structure

### The Application Window
The main window is a split-pane layout:
- **Left Pane (List):** `35%` to `40%` of the window width, constrained by a `min-width` of 300px and a `max-width` of 400px.
- **Right Pane (Preview):** Takes up the remaining `flex-1` space.
- **Divider:** A 1px solid `border-border` separating the two panes vertically.

### Padding Rules
1. **Window Margins:** There are no outer window margins. Components touch the edges of the window frame (frameless design) to maximize space, with internal padding pushing content inward.
2. **Preview Pane:** Padding of `p-6` (24px) all around to give code blocks room to breathe.
3. **List Pane:** The search bar area gets `p-4` (16px), while the virtual list itself flushes to the edges, applying `px-4` (16px) individually to each list item.

## 3. Borders & Elevation

### Borders
- **Stroke Width:** Always `1px`.
- **Radii:** 
  - Main Window: `12px` (`rounded-lg`)
  - Modals: `12px` (`rounded-lg`)
  - Cards/Inputs/Buttons: `6px` (`rounded-md`)
  - Checkboxes/Tags: `4px` (`rounded-sm`)

### Elevation & Shadows
Shadows are never used for decoration. They indicate Z-axis elevation only.
- **Level 1 (Surface):** No shadow. Relies entirely on the 1px border. Used for sidebars and list items.
- **Level 2 (Dropdowns):** `shadow-md` (0 4px 6px -1px rgba(0, 0, 0, 0.5)). Used for context menus.
- **Level 3 (Modals):** `shadow-2xl` (0 25px 50px -12px rgba(0, 0, 0, 0.75)). Creates massive separation from the blurred background.

## 4. Window Behaviour

### Dimensions

| Property | Value | Rationale |
| :--- | :--- | :--- |
| **Minimum Width** | 600px | Below this, the split-pane layout cannot display the list and preview side-by-side with usable proportions. |
| **Minimum Height** | 400px | Ensures the search bar, at least 4–5 list items, and the toolbar are all visible without scrolling the chrome itself. |
| **Default Width** | 840px | Comfortable split: ~340px list + ~500px preview. |
| **Default Height** | 620px | Shows approximately 8–9 clipboard items without scrolling. |
| **Maximum** | Unbounded | The window should scale freely. The list pane is width-constrained (`max-width: 400px`); the preview pane takes remaining space. |

### Resize Rules

1. **Below 600px width:** The Tauri `min_width` constraint prevents this. If the constraint is ever relaxed, the preview pane should collapse entirely, leaving only the list pane visible (single-column fallback).
2. **Below 400px height:** The Tauri `min_height` constraint prevents this.
3. **Very wide windows (>1400px):** The preview pane expands freely. Code content in the preview should still be constrained to `max-width: 80ch` for readability, centered within the pane.
4. **Very tall windows:** The virtual list simply renders more visible items. No layout changes are required.
5. **Split pane divider:** The divider between the list and preview panes is not user-resizable in v1.0. The list pane width is fixed at `clamp(300px, 38%, 400px)`.

---

## See Also

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — Spacing and radius CSS custom properties
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component padding and layout specs
- [BRAND_FOUNDATION.md](../brand/BRAND_FOUNDATION.md) — Spacing philosophy and shadow philosophy
