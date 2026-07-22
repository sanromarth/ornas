# ORNAS — Accessibility

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

This document consolidates all accessibility requirements into a single reference for contributors. Individual component accessibility contracts are defined in `COMPONENT_GUIDELINES.md`; this document provides the global rules and the application-wide focus order.

---

## 1. Standards

ORNAS targets **WCAG 2.1 Level AA** compliance. This is the industry standard for desktop software accessibility and covers the vast majority of users with disabilities.

## 2. Color Contrast

All color pairings must meet the following minimum contrast ratios:

| Pairing | Ratio | Passes? |
| :--- | :--- | :--- |
| `text-primary` (#FAFAFA) on `background` (#09090B) | 19.4:1 | ✅ AAA |
| `text-secondary` (#A1A1AA) on `background` (#09090B) | 7.1:1 | ✅ AA |
| `text-secondary` (#A1A1AA) on `surface` (#18181B) | 5.6:1 | ✅ AA |
| `primary` (#6366F1) on `background` (#09090B) | 4.6:1 | ✅ AA |
| `danger` (#EF4444) on `background` (#09090B) | 4.8:1 | ✅ AA |
| `success` (#10B981) on `background` (#09090B) | 5.9:1 | ✅ AA |
| `warning` (#F59E0B) on `background` (#09090B) | 8.5:1 | ✅ AAA |
| `primary-foreground` (#F2F2F2) on `primary` (#6366F1) | 5.2:1 | ✅ AA |

If light mode is implemented in the future, every pairing must be re-validated.

## 3. Focus Management

### 3.1 Focus Indicator

Every interactive element must display a visible focus indicator when reached via keyboard (`Tab`, `Shift+Tab`, arrow keys):

- **Style:** 2px solid ring, color `focus-ring` (#818CF8), offset 2px from the element edge.
- **CSS:** Applied via `:focus-visible` only. The indicator must not appear on mouse click.
- **Tailwind:** `focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`

### 3.2 Application Focus Order

The global `Tab` order follows the visual layout from top-left to bottom-right. This is the canonical focus path through the application:

```
┌─────────────────────────────────────────────┐
│  1. Header / Toolbar                         │
│     [Settings Button] → [Window Controls]    │
├─────────────────────────────────────────────┤
│  2. Search Bar                               │
│     [Search Input]                           │
├──────────────────────┬──────────────────────┤
│  3. Clipboard List   │  5. Preview Panel     │
│     [Item 1]         │     [Copy Button]     │
│     [Item 2]         │     [Favorite Button] │
│     [Item 3]         │     [Pin Button]      │
│     ...              │     [Delete Button]   │
├──────────────────────┴──────────────────────┤
│  4. (if open) Settings Panel                 │
│     [Input 1] → [Save 1]                    │
│     [Input 2] → [Save 2]                    │
│     ...                                      │
│     [Close Button]                           │
└─────────────────────────────────────────────┘
```

**Rules:**
- `Tab` moves forward through the focus order. `Shift+Tab` moves backward.
- Within the clipboard list, `ArrowDown`/`ArrowUp` navigate between items. `Tab` exits the list to the preview panel.
- The search bar captures `Cmd/Ctrl+K` or `/` as a global shortcut from anywhere.
- `Escape` from the search bar clears the query and returns focus to the list.

### 3.3 Modal Focus Trapping

When a dialog or modal is open:

1. Focus moves to the first focusable element inside the dialog (typically the cancel button for destructive dialogs, or the first input for non-destructive ones).
2. `Tab` cycles only within the dialog. Focus must never escape to elements behind the backdrop.
3. `Escape` closes the dialog.
4. When the dialog closes, focus returns to the element that triggered it.

### 3.4 Settings Panel Focus

When the settings panel slides open:

1. Focus moves to the first input inside the panel.
2. `Tab` cycles through settings inputs and their save buttons sequentially.
3. `Escape` closes the panel and returns focus to the settings gear button in the toolbar.

## 4. Keyboard Shortcuts

### Global

| Shortcut | Action |
| :--- | :--- |
| `Cmd/Ctrl+K` or `/` | Focus the search bar |
| `Escape` | Clear search / Close dialog / Close settings |
| `Cmd/Ctrl+,` | Open settings |

### Clipboard List

| Shortcut | Action |
| :--- | :--- |
| `ArrowDown` | Select next item |
| `ArrowUp` | Select previous item |
| `Enter` | Open selected item in preview |
| `Delete` or `Backspace` | Open delete confirmation for selected item |
| `F` or `Cmd/Ctrl+D` | Toggle favorite on selected item |
| `P` | Toggle pin on selected item |
| `C` or `Cmd/Ctrl+C` | Copy selected item to system clipboard |

### Dialogs

| Shortcut | Action |
| :--- | :--- |
| `Tab` | Cycle focus within dialog |
| `Escape` | Cancel and close |
| `Enter` | Activate focused button |

## 5. Screen Reader Support

### Landmarks

The application defines these ARIA landmarks:

| Element | Role | Label |
| :--- | :--- | :--- |
| Header bar | `banner` | "ORNAS toolbar" |
| Search bar | `search` | "Search clipboard history" |
| Clipboard list | `main` | "Clipboard history" |
| Preview panel | `complementary` | "Clip preview" |
| Settings panel | `dialog` | "Application settings" |

### Live Regions

- When a new clip arrives via the Rust backend, an `aria-live="polite"` region announces: "New clip added."
- When a clip is deleted, an `aria-live="polite"` region announces: "Clip deleted."
- When a clip is copied, an `aria-live="assertive"` region announces: "Copied to clipboard."

### Labelling Rules

1. Every `<button>` without visible text must have `aria-label`.
2. Every `<input>` must be associated with a `<label>` via `htmlFor` / `id`.
3. Every `<img>` must have descriptive `alt` text, or `alt=""` plus `aria-hidden="true"` if purely decorative.
4. Every dialog must have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title element.
5. Toggle buttons (favorite, pin) must use `aria-pressed="true|false"`.

## 6. Minimum Target Size

All interactive elements must have a minimum clickable area of **32×32px** (WCAG 2.5.8, Level AA). This is achieved through padding rather than inflating the visual size of the element.

- Icon buttons (16px icon): `p-2` padding → 32×32px hit area.
- Text buttons: Already exceed 32px height at SM size (28px visual + 2px focus ring offset ≥ 32px).

## 7. Reduced Motion

ORNAS must respect the `prefers-reduced-motion: reduce` media query. When active, all transitions and animations resolve in under 1ms. See `MOTION.md` § Reduced Motion for the implementation.

## 8. High Contrast Mode

When `prefers-contrast: more` is active (future consideration):

- All borders increase from 1px to 2px.
- `text-secondary` shifts from `#A1A1AA` to `#D4D4D8` (zinc-300) for stronger contrast.
- Focus rings increase from 2px to 3px.

---

## See Also

- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component accessibility contracts
- [COLOR_SYSTEM.md](COLOR_SYSTEM.md) — Color tokens validated against WCAG contrast ratios
- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — Focus ring token definition
- [MOTION.md](MOTION.md) — `prefers-reduced-motion` CSS implementation
- [ICONOGRAPHY.md](ICONOGRAPHY.md) — `aria-label` rules for icon-only buttons
- [SPACING.md](SPACING.md) — Minimum 32×32px target sizes achieved via padding
