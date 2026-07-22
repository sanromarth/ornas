# ORNAS — Typography

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

Typography in ORNAS is built around legibility, data density, and technical precision.

## 1. Font Families

- **Heading Font:** `Outfit` (Geometric Sans-Serif)
  - Used strictly for Application Titles, Empty State Headers, and large Modal Titles.
  - Weights: `600` (Semibold).
  
- **Body Font:** `Inter` (Neo-Grotesque Sans-Serif)
  - Used for 95% of the application UI. Buttons, list items, search bars, metadata, and settings text.
  - Weights: `400` (Regular), `500` (Medium).

- **Monospace Font:** `JetBrains Mono`
  - Used exclusively for rendering the contents of user clips (code, JSON, logs) and hotkeys (`Cmd+C`).
  - Features enabled: Ligatures must be active.
  - Weights: `400` (Regular).

## 2. Typographic Scale

ORNAS uses a tight desktop scale to maximize data density without feeling cluttered.

| Level | Size (rem/px) | Line Height | Font Family | Weight | Tracking (Letter Spacing) | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Title** | `1.5rem` (24px) | `1.2` | Outfit | 600 | `-0.02em` | Empty state headers, major feature titles. |
| **Heading** | `1.125rem` (18px) | `1.25` | Outfit | 600 | `-0.01em` | Modal titles, Settings category headers. |
| **Body Large** | `1rem` (16px) | `1.5` | Inter | 400 | `normal` | Search bar input text. |
| **Body Default** | `0.875rem` (14px) | `1.5` | Inter | 400/500 | `normal` | Clipboard list items, button text, standard UI text. |
| **Body Small** | `0.75rem` (12px) | `1.4` | Inter | 400 | `normal` | Timestamps, character counts, subtle metadata. |
| **Code Block** | `0.875rem` (14px) | `1.6` | JetBrains Mono | 400 | `normal` | Clipboard preview pane content. |
| **Code Micro** | `0.75rem` (12px) | `1.0` | JetBrains Mono | 400 | `normal` | Keyboard shortcut badges (e.g., `⌘K`). |

## 3. Formatting Rules

1. **Truncation:** Long titles in the clipboard list must truncate using standard CSS `text-ellipsis` with `whitespace-nowrap`. Never wrap list item titles to a second line.
2. **Readability Limit:** The preview pane containing monospace code should wrap at roughly 80-100 characters to prevent excessive horizontal scrolling, utilizing `break-all` for long URLs.
3. **No Italics:** Italics are not used anywhere in the ORNAS UI to maintain a structural, technical aesthetic.

---

## See Also

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — CSS custom properties for font families
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component font size and weight usage
- [BRAND_FOUNDATION.md](../brand/BRAND_FOUNDATION.md) — Typography philosophy and font selection rationale
