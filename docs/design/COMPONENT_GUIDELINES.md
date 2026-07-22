# ORNAS — Component Guidelines

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

This document specifies every production-ready UI component in the ORNAS design system. Each component is defined by its anatomy, states, tokens, accessibility contract, and keyboard interactions.

This is a **design specification**, not implementation code. Components reference tokens defined in `DESIGN_TOKENS.md`, colors from `COLOR_SYSTEM.md`, typography from `TYPOGRAPHY.md`, spacing from `SPACING.md`, icons from `ICONOGRAPHY.md`, and animations from `MOTION.md`.

---

## 1. Buttons

### 1.1 Variants

| Variant | Background | Text | Border | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `bg-primary` | `text-primary-foreground` | None | Single primary action per screen. "Save Settings", "Clear History". |
| **Secondary** | `bg-surface` | `text-primary` | `border-border` (1px) | Standard actions. "Cancel", "Close". |
| **Ghost** | `transparent` | `text-secondary` | None | Toolbar icon buttons, inline actions. Blends into surrounding UI. |
| **Destructive** | `bg-danger` | `white` | None | Irreversible actions. "Delete", "Clear All". |

### 1.2 Sizes

| Size | Height | Padding | Font Size | Icon Size | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SM** | 28px | `px-2.5` | 12px | 14px | Inline actions inside list items, toolbar buttons. |
| **MD** | 36px | `px-4` | 14px | 16px | Standard dialogs, settings. Default size. |
| **LG** | 44px | `px-6` | 16px | 20px | Rare. Full-width actions in empty states. |

### 1.3 States

| State | Treatment |
| :--- | :--- |
| **Default** | As per variant table. |
| **Hover** | Lighten background by one step. Primary: `bg-primary` + `brightness-110`. Secondary: `bg-hover`. Ghost: `bg-hover`. |
| **Active / Pressed** | `transform: scale(0.97)`. Duration: 100ms. |
| **Focus-Visible** | 2px `focus-ring` ring offset by 2px from the button edge. |
| **Disabled** | `opacity: 0.5`, `pointer-events: none`, `cursor: not-allowed`. |
| **Loading** | Replace label text with a 14px spinner. Disable pointer events. Button width must not change. |

### 1.4 Anatomy

```
┌─────────────────────────────────┐
│  [Icon 16px]  4px  [Label 14px] │
│         padding: px-4           │
└─────────────────────────────────┘
         border-radius: 6px
```

### 1.5 Accessibility

- All buttons must use `<button>` elements, never `<div>` or `<span>`.
- Icon-only buttons require `aria-label`.
- Disabled buttons must have `aria-disabled="true"` and remain in the tab order (not `tabindex="-1"`) so screen readers can announce them.

### 1.6 Keyboard

- `Enter` / `Space`: Activates the button.
- `Tab`: Moves focus to the next focusable element.

---

## 2. Inputs

### 2.1 Anatomy

```
┌──────────────────────────────────┐
│ Label (12px, text-secondary)     │
│ ┌──────────────────────────────┐ │
│ │ [Value text, 14px]           │ │
│ │ height: 36px, padding: px-3 │ │
│ └──────────────────────────────┘ │
│ Helper text (12px, text-secondary│
│ or text-danger if error)         │
└──────────────────────────────────┘
```

### 2.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-background` |
| **Border** | `border-border` (1px solid) |
| **Border (focus)** | `border-primary` |
| **Text** | `text-primary` |
| **Placeholder** | `text-secondary` |
| **Radius** | `rounded-md` (6px) |
| **Height** | 36px |
| **Font** | Inter, 14px |

### 2.3 States

| State | Treatment |
| :--- | :--- |
| **Default** | 1px `border-border`. |
| **Hover** | Border brightens to `border-hover` (slightly lighter). |
| **Focus** | Border changes to `border-primary`. 2px `focus-ring` ring appears. |
| **Error** | Border changes to `border-danger`. Helper text turns `text-danger`. |
| **Disabled** | `bg-muted`, `opacity: 0.5`, `cursor: not-allowed`. |

### 2.4 Accessibility

- Every input must have an associated `<label>` element via `htmlFor`.
- Error messages must be linked via `aria-describedby`.
- Required fields must have `aria-required="true"`.

---

## 3. Search Bar

### 3.1 Anatomy

```
┌───────────────────────────────────────┐
│ [🔍 20px]  8px  [Input text, 16px]    │
│ height: 44px, padding: px-4           │
│ full width of the list pane            │
└───────────────────────────────────────┘
```

### 3.2 Behaviour

- The search input is **always visible** at the top of the list pane. It is never hidden behind a toggle.
- Typing triggers a debounced query after 150ms of inactivity.
- While debouncing, the search icon may subtly pulse (opacity 0.5 → 1.0, 150ms cycle, max 2 cycles).
- Clearing the input (via `Escape` or the clear button) immediately returns to the full clipboard history.
- A trailing `X` (clear) button appears only when the input has a value.

### 3.3 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Border** | `border-border` (bottom only, 1px) |
| **Icon Color** | `text-secondary` |
| **Text** | `text-primary`, Inter, 16px |
| **Placeholder** | `text-secondary`, "Search clipboard…" |
| **Height** | 44px |

### 3.4 Keyboard

- `Cmd/Ctrl+K` or `/`: Focuses the search bar from anywhere in the app.
- `Escape`: Clears the query and returns focus to the list.
- `ArrowDown`: Moves focus from the search bar to the first list item.

---

## 4. Dialogs (Modals)

### 4.1 Anatomy

```
┌─ Backdrop (bg-black/60, blur(4px)) ────┐
│                                          │
│   ┌─ Dialog ───────────────────────┐     │
│   │ Title (18px, Outfit, Semibold) │     │
│   │                                │     │
│   │ Body (14px, Inter)             │     │
│   │                                │     │
│   │ ┌────────┐  8px  ┌──────────┐ │     │
│   │ │ Cancel │       │ Confirm  │ │     │
│   │ └────────┘       └──────────┘ │     │
│   └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### 4.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Border** | `border-border` (1px) |
| **Radius** | `rounded-lg` (12px) |
| **Shadow** | `shadow-2xl` |
| **Max Width** | 420px |
| **Padding** | `p-6` (24px) |
| **Backdrop** | `bg-black/60` with `backdrop-blur-sm` |

### 4.3 Behaviour

- Modals open with a scale-in animation (0.95 → 1.0, 200ms).
- Modals close with a scale-out (1.0 → 0.97, 100ms). Closing is faster than opening.
- The backdrop traps all pointer events outside the dialog.

### 4.4 Accessibility

- Focus is trapped inside the dialog while open.
- When opened, focus moves to the first focusable element (typically the close button or the primary action).
- When closed, focus returns to the element that triggered the dialog.
- `Escape` closes the dialog.
- The dialog has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title.

### 4.5 Confirm Dialog (Destructive)

For destructive actions (delete clip, clear history):
- Title clearly states the consequence: "Delete this clip?"
- Body explains what will happen: "This action cannot be undone."
- Cancel button is Secondary variant (left).
- Confirm button is Destructive variant (right) and is **never** auto-focused.

---

## 5. Context Menus

### 5.1 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Border** | `border-border` (1px) |
| **Radius** | `rounded-md` (6px) |
| **Shadow** | `shadow-md` |
| **Min Width** | 180px |
| **Item Height** | 32px |
| **Item Padding** | `px-3` |
| **Font** | Inter, 14px |
| **Separator** | 1px `border-border`, with `my-1` vertical margin |

### 5.2 Menu Item States

| State | Treatment |
| :--- | :--- |
| **Default** | `text-primary`, transparent background. |
| **Hover / Focus** | `bg-hover`, `text-primary`. |
| **Disabled** | `text-secondary` at 50% opacity. |
| **Destructive** | `text-danger` for the label. On hover: `bg-danger/10`. |

### 5.3 Anatomy

```
┌──────────────────────────────┐
│ [Icon 16px]  8px  Copy       │  ← Item
│──────────────────────────────│  ← Separator
│ [Icon 16px]  8px  Favorite   │
│ [Icon 16px]  8px  Pin        │
│──────────────────────────────│
│ [Icon 16px]  8px  Delete     │  ← Destructive
└──────────────────────────────┘
```

### 5.4 Keyboard

- `ArrowDown` / `ArrowUp`: Navigate items.
- `Enter` / `Space`: Activate the focused item.
- `Escape`: Close the menu.

---

## 6. Lists (Clipboard List)

### 6.1 Anatomy

Each clipboard list item:

```
┌───────────────────────────────────────────────┐
│ [TypeIcon 16px] 8px [Preview text, truncated] │
│                     [Timestamp, 12px, muted]  │
│                                    [Actions]  │
│ height: ~64px, padding: px-4 py-3             │
└───────────────────────────────────────────────┘
```

### 6.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background (default)** | `transparent` |
| **Background (hover)** | `bg-hover` |
| **Background (selected)** | `bg-selection` |
| **Border bottom** | `border-border` (1px) |
| **Title font** | Inter, 14px, `text-primary`, single line, `text-ellipsis` |
| **Timestamp font** | Inter, 12px, `text-secondary` |
| **Item height** | 64px (estimated for virtual list) |

### 6.3 States

| State | Treatment |
| :--- | :--- |
| **Default** | Transparent background. |
| **Hover** | `bg-hover`. Action buttons (favorite, pin, delete) become visible. |
| **Selected** | `bg-selection`. Text remains `text-primary`. |
| **Pinned** | A subtle pin indicator icon appears in the top-right corner. |
| **Favorited** | The star icon is filled. |

### 6.4 Action Buttons

Action buttons (Favorite, Pin, Delete) are Ghost SM buttons that appear on hover in the top-right area of the list item. They use `opacity: 0` by default and `opacity: 1` on item hover, with a 100ms transition.

### 6.5 Virtualization

The list is virtualized using `@tanstack/react-virtual`. The estimated row height is 64px. The overscan count should be 5 items above and below the viewport.

### 6.6 Keyboard

- `ArrowDown` / `ArrowUp`: Navigate between items.
- `Enter`: Select the focused item (opens it in the preview pane).
- `Delete` / `Backspace`: Opens the delete confirmation dialog for the focused item.
- `F` or `Cmd/Ctrl+D`: Toggle favorite on the focused item.
- `P`: Toggle pin on the focused item.

---

## 7. Settings Panel

### 7.1 Anatomy

The settings panel is a full-height overlay or side-sheet that slides in from the right edge of the application window.

```
┌─────────────────────────────────────┐
│ Settings (18px, Outfit)      [X]    │  ← Header
│─────────────────────────────────────│
│                                     │
│ Retention Days                      │  ← Section
│ ┌─────────────────────────────────┐ │
│ │ [Input: 30]              [Save] │ │
│ └─────────────────────────────────┘ │
│ How long clips are kept before      │  ← Helper text
│ automatic cleanup.                  │
│                                     │
│ Max History Size                    │
│ ┌─────────────────────────────────┐ │
│ │ [Input: 10000]           [Save] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Theme                               │
│ ┌─────────────────────────────────┐ │
│ │ [Select: System ▾]       [Save] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Excluded Apps                       │
│ ┌─────────────────────────────────┐ │
│ │ [Input: com.app1, com.app2]     │ │
│ │                          [Save] │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 7.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Width** | 400px (fixed) |
| **Border left** | `border-border` (1px) |
| **Padding** | `p-6` (24px) |
| **Section gap** | `gap-6` (24px) |
| **Label font** | Inter, 14px, `font-medium`, `text-primary` |
| **Helper font** | Inter, 12px, `text-secondary` |

### 7.3 Behaviour

- Each setting row has its own independent "Save" button.
- The Save button is disabled when the current value matches the persisted backend value.
- On save, the button shows a loading state (spinner), then briefly flashes "Saved ✓" before returning to "Save".
- On error, the helper text turns `text-danger` with the error message.

### 7.4 Keyboard

- `Escape`: Closes the settings panel.
- `Tab`: Navigates between inputs and save buttons sequentially.

---

## 8. Toolbar / Header Bar

### 8.1 Anatomy

```
┌───────────────────────────────────────────────┐
│ ORNAS (16px, Outfit, 600)          [⚙] [—][×]│
│ height: 44px, padding: px-4                    │
│ border-bottom: 1px solid border                │
│ -webkit-app-region: drag                       │
└───────────────────────────────────────────────┘
```

### 8.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-background` |
| **Height** | 44px |
| **Border bottom** | `border-border` (1px) |
| **Title font** | Outfit, 16px, weight 600, `text-primary` |
| **Button area** | Ghost SM buttons, `no-drag` region |

### 8.3 Behaviour

- The entire header bar is a draggable region (`-webkit-app-region: drag`) for Tauri window management.
- Interactive buttons (Settings gear, window controls) are explicitly `no-drag`.
- On macOS, the traffic lights (close/minimize/maximize) are native and positioned by Tauri. The title is centered.
- On Windows/Linux, custom window control buttons (minimize `—`, maximize `□`, close `×`) are positioned flush-right.

---

## 9. Sidebar (Future)

Reserved for future navigation (e.g., Collections, Tags). The sidebar specifications are deferred until Milestone 3.

### Tokens (Preemptive)

| Property | Value |
| :--- | :--- |
| **Background** | `bg-background` |
| **Width** | 220px |
| **Border right** | `border-border` (1px) |
| **Item height** | 32px |
| **Item padding** | `px-3` |

---

## 10. Clipboard Preview Panel

### 10.1 Anatomy

```
┌─────────────────────────────────────────┐
│ [TypeIcon] 8px  Text Clip               │  ← Header
│ Copied 2 minutes ago  •  1,234 chars    │  ← Metadata
│─────────────────────────────────────────│
│                                         │
│  const hello = "world";                 │  ← Content (mono)
│  console.log(hello);                    │
│                                         │
│                                         │
│                                         │
│─────────────────────────────────────────│
│ [📋 Copy]  [⭐ Favorite]  [📌 Pin]  [🗑 Delete] │  ← Actions
└─────────────────────────────────────────┘
```

### 10.2 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Border left** | `border-border` (1px) |
| **Header padding** | `p-4` |
| **Content padding** | `p-6` |
| **Content font** | JetBrains Mono, 14px, `text-primary` |
| **Metadata font** | Inter, 12px, `text-secondary` |
| **Action bar** | `border-top: 1px border-border`, `p-4` |
| **Title font** | Inter, 14px, `font-medium`, `text-primary` |

### 10.3 Content Rendering

- **Text clips:** Rendered in JetBrains Mono with `white-space: pre-wrap` and `word-break: break-all`.
- **URL clips:** Rendered as clickable links with `text-info` color and underline on hover.
- **Image clips:** Rendered as `<img>` with `max-width: 100%`, `border-radius: 6px`, and a 1px border.
- **Empty (no selection):** Shows the Empty State component (see §13).

### 10.4 Action Bar

Action buttons in the footer use the SM button size with Ghost variant. They are always visible (not hover-dependent) in the preview panel.

---

## 11. Notifications / Toasts

### 11.1 Tokens

| Property | Value |
| :--- | :--- |
| **Background** | `bg-surface` |
| **Border** | `border-border` (1px) |
| **Radius** | `rounded-md` (6px) |
| **Shadow** | `shadow-lg` |
| **Max Width** | 360px |
| **Padding** | `px-4 py-3` |
| **Font** | Inter, 14px |
| **Position** | Bottom-right, 16px from edges |
| **Duration** | Auto-dismiss after 3000ms |

### 11.2 Variants

| Variant | Icon | Accent |
| :--- | :--- | :--- |
| **Success** | `Check` | `text-success` left border (3px solid) |
| **Error** | `AlertTriangle` | `text-danger` left border |
| **Info** | `Info` | `text-info` left border |
| **Warning** | `AlertTriangle` | `text-warning` left border |

### 11.3 Anatomy

```
┌──────────────────────────────────────┐
│ ┃ [✓ 16px]  8px  Copied to clipboard │
│ ┃                                    │
│ 3px accent border                    │
└──────────────────────────────────────┘
```

### 11.4 Behaviour

- Toasts stack vertically with 8px gap.
- Maximum 3 toasts visible simultaneously.
- Each toast has a subtle enter animation (slide up 8px + fade in, 200ms).
- Auto-dismiss is paused on hover.

---

## 12. Select / Dropdown

### 12.1 Tokens

| Property | Value |
| :--- | :--- |
| **Trigger** | Same visual treatment as Input (§2). Includes a `ChevronDown` icon on the right. |
| **Dropdown** | Same as Context Menu (§5). |
| **Selected item** | `bg-primary/10`, `text-primary`. |

### 12.2 Behaviour

- Click or `Space`/`Enter` on the trigger opens the dropdown.
- Arrow keys navigate options.
- `Enter` selects the focused option.
- `Escape` closes without selecting.
- The dropdown is positioned below the trigger. If there is insufficient space below, it flips above.

---

## 13. Empty States

### 13.1 Anatomy

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           [Icon 48px, muted]            │
│                                         │
│     Title (18px, Outfit, Semibold)      │
│     Subtitle (14px, Inter, muted)       │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### 13.2 Variants

| Context | Icon | Title | Subtitle |
| :--- | :--- | :--- | :--- |
| **No clips** | `ClipboardList` (LG) | No clipboard history | Copy something to get started. |
| **No search results** | `SearchX` (LG) | No results found | Try a different search query. |
| **No selection** | `MousePointer` (LG) | Select a clip | Choose an item from the list to preview. |
| **Error** | `AlertTriangle` (LG) | Something went wrong | {error.message} |

### 13.3 Tokens

| Property | Value |
| :--- | :--- |
| **Icon color** | `text-secondary` at 50% opacity |
| **Title** | `text-primary`, Outfit, 18px, weight 600 |
| **Subtitle** | `text-secondary`, Inter, 14px |
| **Layout** | Centered vertically and horizontally in the available pane. `gap-3` between elements. |

---

## 14. Global Accessibility Contract

These rules apply to every component without exception:

1. **Color contrast:** All text must meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text). `#FAFAFA` on `#09090B` = 19.4:1. `#A1A1AA` on `#09090B` = 7.1:1. Both pass.
2. **Focus visibility:** Every interactive element must show a visible focus indicator on `:focus-visible`. The indicator is a 2px `focus-ring` (`#818CF8`) ring with a 2px offset.
3. **Keyboard navigation:** Every feature must be operable without a mouse. Tab order follows the visual reading order (left-to-right, top-to-bottom).
4. **Screen readers:** All images have `alt` text. All icon-only buttons have `aria-label`. All dialogs have `aria-labelledby` and `aria-describedby`.
5. **Reduced motion:** All animations are disabled when `prefers-reduced-motion: reduce` is active.
6. **Minimum target size:** All interactive elements have a minimum clickable area of 32×32px (WCAG 2.5.8).

---

## See Also

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — CSS custom properties consumed by these components
- [COLOR_SYSTEM.md](COLOR_SYSTEM.md) — Color palette for component states
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — Font sizes and weights used in components
- [SPACING.md](SPACING.md) — Padding, margins, and border radii
- [ICONOGRAPHY.md](ICONOGRAPHY.md) — Icon sizing and approved catalogue
- [MOTION.md](MOTION.md) — Per-component animation specifications
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — Full accessibility contract, focus order, and ARIA requirements
