# ORNAS — Color System

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

The ORNAS color system is strictly Dark-Mode-First. It relies heavily on high-contrast monochromes (zinc/grays) to establish hierarchy, with sparing use of a single vibrant primary accent (`#6366F1`) to indicate interactive focus.

## 1. Backgrounds & Surfaces

In a desktop application like ORNAS, layers establish the z-axis.

- **Background (`bg-background` / `#09090B`)**:
  - Usage: The absolute base layer. Used for the application window background, the primary list view, and full-screen empty states.
  - Emotion: Deep space, technical canvas.
  
- **Surface (`bg-surface` / `#18181B`)**:
  - Usage: Elevated components resting on the background. Used for the Clipboard Preview Panel, Sidebars, and active/selected list items.
  - Emotion: Subtle structural separation.

## 2. Borders & Dividers

- **Border (`border-border` / `#27272A`)**:
  - Usage: Universal 1px structural separator. Used to divide the list from the preview panel, border inputs, and define card edges.
  - Rule: Never use heavy borders. 1px solid is the maximum weight.

## 3. Typography

- **Text Primary (`text-primary` / `#FAFAFA`)**:
  - Usage: Standard reading text, list item titles, input values.
  - Why not pure white? `#FFFFFF` on `#09090B` creates astigmatism halation and eye fatigue. `#FAFAFA` softens the contrast slightly for extended developer reading.
  
- **Text Secondary (`text-secondary` / `#A1A1AA`)**:
  - Usage: Timestamps, metadata, placeholder text in inputs, and sub-labels.

## 4. Interactive States

- **Hover (`bg-hover` / `#27272A`)**:
  - Usage: Applied when the mouse rests on a clickable list item or secondary button.
  
- **Selection (`bg-selection` / `#3730A3`)**:
  - Usage: The actively focused/selected clipboard item in the master list. 
  
- **Focus Ring (`ring-focus-ring` / `#818CF8`)**:
  - Usage: The accessibility ring applied via `:focus-visible` to inputs and buttons when navigated via keyboard.

## 5. Semantic Feedback Colors

Semantic colors are strictly forbidden for decoration. They are reserved for system states.

- **Success (`text-success` / `#10B981`)**: Used exclusively for "Copied!" toasts.
- **Warning (`text-warning` / `#F59E0B`)**: Used exclusively for system warnings (e.g., database near capacity).
- **Danger (`bg-danger`, `text-danger` / `#EF4444`)**: Used exclusively for destructive actions like the "Delete Clip" button or error dialogs.
- **Info (`text-info` / `#3B82F6`)**: System updates or neutral badging.

## 6. Theme Implementation

### Architecture

ORNAS implements theming via **CSS custom properties** scoped to a `data-theme` attribute on the `<html>` element. This approach is Tailwind-native and allows instant theme switching without page reload.

```html
<html data-theme="dark">   <!-- or "light" or "system" -->
```

### Theme Resolution Order

1. If the user has explicitly chosen a theme via the Settings panel, that theme is persisted to SQLite via the Rust `SettingsService` and takes priority.
2. If the setting is `"system"`, ORNAS reads the OS preference via `window.matchMedia('(prefers-color-scheme: dark)')` and listens for changes.
3. On first launch before any setting exists, the default is `"dark"`.

### CSS Structure

```css
/* Dark theme (default) */
:root,
[data-theme="dark"] {
  --background: 240 10% 4%;
  --surface: 240 6% 10%;
  --border: 240 5% 16%;
  --text-primary: 0 0% 98%;
  --text-secondary: 240 5% 65%;
  /* ... all tokens from DESIGN_TOKENS.md */
}

/* Light theme */
[data-theme="light"] {
  --background: 0 0% 100%;       /* #FFFFFF */
  --surface: 240 5% 96%;         /* #F4F4F5 */
  --border: 240 6% 90%;          /* #E4E4E7 */
  --text-primary: 240 10% 4%;    /* #09090B */
  --text-secondary: 240 4% 46%;  /* #71717A */
  --selection: 238 80% 90%;      /* Light indigo tint */
  --hover: 240 5% 92%;           /* #EBEBED */
  /* Primary accent remains #6366F1 for brand continuity */
}

/* System theme (delegates to OS) */
@media (prefers-color-scheme: light) {
  [data-theme="system"] {
    /* Inherits light theme tokens */
  }
}
@media (prefers-color-scheme: dark) {
  [data-theme="system"] {
    /* Inherits dark theme tokens */
  }
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
darkMode: ['selector', '[data-theme="dark"]'],
```

### Tauri Integration

The Rust backend stores the user's theme preference in the `settings` SQLite table as `{ key: "theme", value: "dark" | "light" | "system" }`. On application launch, the React frontend reads this value via `getSettings()` and applies the corresponding `data-theme` attribute before the first paint to prevent flash-of-unstyled-content (FOUC).

---

## See Also

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — CSS custom properties that implement this color system
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — Contrast ratio validation for all color pairings
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component color usage
- [BRAND_FOUNDATION.md](../brand/BRAND_FOUNDATION.md) — Color philosophy and brand positioning
