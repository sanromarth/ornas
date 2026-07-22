# ORNAS — Design Tokens

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

This document defines the semantic design tokens for ORNAS. These tokens bridge the gap between design and our Tailwind CSS configuration.

## CSS Custom Properties Structure

All values in ORNAS are mapped to semantic CSS custom properties in `index.css`. We do not use raw hex codes or raw pixel values in our React components.

### 1. Colors (HSL format for Tailwind opacity support)

```css
:root {
  /* Surface & Background */
  --background: 240 10% 4%; /* #09090B */
  --surface: 240 6% 10%; /* #18181B */
  --border: 240 5% 16%; /* #27272A */

  /* Primary Brand Accent */
  --primary: 238 80% 67%; /* #6366F1 */
  --primary-foreground: 240 5% 96%; /* #F2F2F2 */

  /* Text Typography */
  --text-primary: 0 0% 98%; /* #FAFAFA */
  --text-secondary: 240 5% 65%; /* #A1A1AA */

  /* Interaction States */
  --muted: 240 5% 16%; /* #27272A */
  --hover: 240 5% 16%; /* #27272A */
  --selection: 244 55% 41%; /* #3730A3 */
  --focus-ring: 238 82% 74%; /* #818CF8 */

  /* Semantic Feedback */
  --success: 160 84% 39%; /* #10B981 */
  --warning: 38 92% 50%; /* #F59E0B */
  --danger: 348 83% 60%; /* #EF4444 */
  --info: 217 91% 60%; /* #3B82F6 */
}
```

### 2. Layout & Spacing Tokens

```css
:root {
  --spacing-micro: 0.25rem; /* 4px */
  --spacing-standard: 0.5rem; /* 8px */
  --spacing-component: 1.0rem; /* 16px */
  --spacing-layout: 1.5rem; /* 24px */
  
  --radius-sm: 0.25rem; /* 4px (Checkboxes, micro-tags) */
  --radius-md: 0.375rem; /* 6px (Standard buttons, inputs, cards) */
  --radius-lg: 0.75rem; /* 12px (Modals, main window frame) */
  
  --border-width-default: 1px;
}
```

### 3. Tailwind Configuration Map

These tokens must map directly into `tailwind.config.ts`:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        border: 'hsl(var(--border))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... mapping remaining semantic colors
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      }
    }
  }
}
```

## Immutable Rules
1. **Never use static utility colors:** Do not use `text-zinc-400` or `bg-indigo-500` in the application code. Always use `text-secondary` or `bg-primary`.
2. **Never hardcode spacing beyond layout grids:** Component padding must rely on `p-2` (8px), `p-4` (16px), or `gap-2`. Avoid arbitrary values like `p-[13px]`.
3. **Never use raw z-index values.** Use only the semantic z-index tokens defined below.

### 4. Z-Index Scale

```css
:root {
  --z-base: 0;        /* Default content layer */
  --z-sticky: 10;     /* Sticky headers, pinned toolbar */
  --z-dropdown: 20;   /* Context menus, dropdowns, selects */
  --z-overlay: 30;    /* Settings panel backdrop */
  --z-dialog: 40;     /* Modal dialogs, confirm dialogs */
  --z-toast: 50;      /* Toast notifications (always on top) */
  --z-tooltip: 60;    /* Tooltips (absolute topmost layer) */
}
```

#### Tailwind Configuration

```typescript
// tailwind.config.ts (extend)
zIndex: {
  'base': '0',
  'sticky': '10',
  'dropdown': '20',
  'overlay': '30',
  'dialog': '40',
  'toast': '50',
  'tooltip': '60',
}
```

### 5. Transition Tokens

```css
:root {
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-moderate: 200ms;
  --duration-slow: 300ms;
  --ease-out: ease-out;
  --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## See Also

- [README.md](README.md) — Design system overview and contributor guide
- [COLOR_SYSTEM.md](COLOR_SYSTEM.md) — Color palette and theme implementation
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — Font stack and typographic scale
- [SPACING.md](SPACING.md) — Layout grid and window behavior
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Component specifications that consume these tokens
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — Focus ring token usage and contrast validation
