# ORNAS — Iconography

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

This document defines the icon system for ORNAS. Every icon used in the application UI must conform to these specifications.

---

## 1. Icon Library

ORNAS uses **Lucide React** as its sole icon library.

- **Why Lucide:** Open-source, MIT-licensed, consistent 24×24 grid, 1.5px default stroke, and a massive catalogue of developer-relevant glyphs. It visually matches the "Precision Engineering" aesthetic defined in the Brand Foundation.
- **No mixing:** Do not import icons from Heroicons, Feather, Phosphor, Material, or any other library. A mixed icon language destroys visual consistency.

## 2. Icon Grid & Stroke

| Property | Value | Rationale |
| :--- | :--- | :--- |
| **Grid** | 24×24px | Standard optical grid. All icons align to this baseline regardless of rendered size. |
| **Stroke Width** | 2px | Lucide default. Provides clean legibility at small sizes on both light and dark backgrounds. |
| **Corner Radius** | Matches source SVG | Do not override Lucide's built-in path radii. |
| **Fill** | Never | Icons are always stroked, never filled, unless indicating an active toggle state (see §4). |

## 3. Sizing Scale

Icons are rendered at one of four semantic sizes. Never use arbitrary pixel values.

| Token | Size | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Icon XS** | 14px | `w-3.5 h-3.5` | Inline badges, keyboard shortcut indicators. |
| **Icon SM** | 16px | `w-4 h-4` | List item action buttons (favorite, pin, delete). Toolbar icons. |
| **Icon MD** | 20px | `w-5 h-5` | Search bar icon, settings gear, primary navigation. |
| **Icon LG** | 24px | `w-6 h-6` | Empty state illustrations, modal close buttons. |

## 4. Active vs Inactive States

Icons communicate toggle state through fill, not color change:

- **Inactive:** Stroke only, `text-secondary` color.
- **Active:** Filled variant, `text-primary` color. Example: an outlined star (☆) becomes a filled star (★) when favorited.
- **Hover:** `text-primary` color, stroke only. The color shift alone signals interactivity.

## 5. Icon Color Rules

| State | Color Token | Hex |
| :--- | :--- | :--- |
| **Default** | `text-secondary` | `#A1A1AA` |
| **Hover** | `text-primary` | `#FAFAFA` |
| **Active / Selected** | `text-primary` | `#FAFAFA` |
| **Disabled** | `text-secondary` at 40% opacity | — |
| **Destructive** | `text-danger` | `#EF4444` |
| **Accent (rare)** | `text-primary-accent` | `#6366F1` |

## 6. Icon Spacing

- **Gap between icon and adjacent text label:** 8px (`gap-2`).
- **Gap between icon and adjacent icon in a toolbar:** 4px (`gap-1`).
- **Padding inside an icon-only button:** 8px (`p-2`), creating a 32×32px minimum touch target from a 16px icon.

## 7. Accessibility

- Every icon-only button **must** have an `aria-label` describing its action.
- Icons used purely for decoration alongside visible text labels should carry `aria-hidden="true"`.
- Interactive icon buttons must have a minimum hit area of 32×32px (achieved through padding).

## 8. Icon Catalogue (Core Set)

These are the Lucide icons approved for the current ORNAS feature set:

| Feature | Icon Name | Lucide Import | Size |
| :--- | :--- | :--- | :--- |
| Search | `Search` | `lucide-react/Search` | MD |
| Settings | `Settings` | `lucide-react/Settings` | MD |
| Close / Dismiss | `X` | `lucide-react/X` | MD |
| Favorite (off) | `Star` | `lucide-react/Star` | SM |
| Favorite (on) | `Star` (filled) | `lucide-react/Star` + `fill="currentColor"` | SM |
| Pin (off) | `Pin` | `lucide-react/Pin` | SM |
| Pin (on) | `Pin` (filled) | `lucide-react/Pin` + `fill="currentColor"` | SM |
| Delete | `Trash2` | `lucide-react/Trash2` | SM |
| Copy to Clipboard | `Copy` | `lucide-react/Copy` | SM |
| Text Clip | `Type` | `lucide-react/Type` | SM |
| Image Clip | `Image` | `lucide-react/Image` | SM |
| Link Clip | `Link` | `lucide-react/Link` | SM |
| Code Clip | `Code` | `lucide-react/Code` | SM |
| Empty State | `ClipboardList` | `lucide-react/ClipboardList` | LG |
| No Results | `SearchX` | `lucide-react/SearchX` | LG |
| Warning | `AlertTriangle` | `lucide-react/AlertTriangle` | MD |
| Info | `Info` | `lucide-react/Info` | MD |
| Check / Success | `Check` | `lucide-react/Check` | SM |
| Chevron | `ChevronRight` | `lucide-react/ChevronRight` | SM |

## 9. Forbidden Practices

- Do not use emoji as UI icons.
- Do not use text characters (`×`, `⌘`) as standalone interactive icons without an accessible wrapper.
- Do not animate icons with continuous loops (spinning, pulsing). Icons may transition color or opacity only.
- Do not create custom SVG icons unless Lucide genuinely lacks a suitable glyph. If a custom icon is necessary, it must match Lucide's 24×24 grid and 2px stroke weight exactly.

---

## See Also

- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component icon placement and sizing
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — `aria-label` rules for icon-only buttons
- [COLOR_SYSTEM.md](COLOR_SYSTEM.md) — Icon color tokens by state
- [MOTION.md](MOTION.md) — Icon transition rules (color/opacity only, no loops)
