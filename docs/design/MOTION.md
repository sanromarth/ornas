# ORNAS — Motion & Animation

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

This document defines the animation system for ORNAS. Every transition, micro-interaction, and state change must follow these rules.

---

## 1. Philosophy

Animations in ORNAS exist to **confirm user intent**, not to entertain. They must feel fast, snappy, and mechanical — like a well-engineered tool responding to input.

**Principles:**
- Animation is feedback, never decoration.
- If an animation cannot be justified as improving perceived performance or confirming a state change, remove it.
- Users should never wait for an animation to finish before performing the next action.

## 2. Timing Tokens

| Token | Duration | Easing | Usage |
| :--- | :--- | :--- | :--- |
| **Instant** | 0ms | — | State toggles with no transition (checkbox checks, icon fill swaps). |
| **Fast** | 100ms | `ease-out` | Hover states, focus ring appearance, button press feedback. |
| **Normal** | 150ms | `ease-out` | List item selection highlight, tooltip fade-in, dropdown open. |
| **Moderate** | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Modal scale-in, panel slide, search results appear. |
| **Slow** | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Settings panel open/close, full-screen overlay transitions. Maximum allowed duration. |

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'moderate': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }
  }
}
```

### CSS Custom Properties

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

## 3. Component Animation Specifications

### 3.1 Hover States
- **Property:** `background-color`
- **Duration:** Fast (100ms)
- **Easing:** `ease-out`
- **Behaviour:** Immediate color shift from `transparent` to `bg-hover`. No scale, no shadow, no border change.

### 3.2 Focus Ring
- **Property:** `box-shadow` (ring)
- **Duration:** Fast (100ms)
- **Easing:** `ease-out`
- **Behaviour:** A 2px `focus-ring` color ring appears on `:focus-visible`. It should not animate on `:focus` (mouse click) to avoid visual noise.

### 3.3 Button Press
- **Property:** `transform: scale()`
- **Duration:** Fast (100ms)
- **Easing:** `ease-out`
- **Behaviour:** On `:active`, the button scales to `0.97`. On release, it springs back to `1.0`. This provides tactile feedback.

### 3.4 List Item Selection
- **Property:** `background-color`
- **Duration:** Normal (150ms)
- **Easing:** `ease-out`
- **Behaviour:** The selected item smoothly transitions from its default background to `bg-selection`. No scaling, no sliding.

### 3.5 Clipboard Item Enter (Live Update)
- **Property:** `opacity`, `transform: translateY()`
- **Duration:** Moderate (200ms)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Behaviour:** When a new clip arrives from the Rust backend, the new list item fades in from `opacity: 0, translateY(-8px)` to `opacity: 1, translateY(0)`. Existing items shift down naturally via the virtual list recalculation.

### 3.6 Clipboard Item Delete
- **Property:** `opacity`, `transform: translateX()`, `height`
- **Duration:** Normal (150ms)
- **Easing:** `ease-out`
- **Behaviour:** The deleted item fades out and slides left by 16px (`translateX(-16px)`), then collapses its height to 0. Adjacent items close the gap smoothly.

### 3.7 Modal Open
- **Property:** `opacity`, `transform: scale()`
- **Duration:** Moderate (200ms)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Behaviour:** The modal scales from `0.95` to `1.0` while fading from `opacity: 0` to `1`. The backdrop overlay fades in simultaneously.

### 3.8 Modal Close
- **Property:** `opacity`, `transform: scale()`
- **Duration:** Fast (100ms)
- **Easing:** `ease-out`
- **Behaviour:** The modal scales from `1.0` to `0.97` while fading out. Closing is faster than opening to respect the user's intent to dismiss.

### 3.9 Dropdown / Context Menu
- **Property:** `opacity`, `transform: translateY()`
- **Duration:** Normal (150ms)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Behaviour:** The menu slides down from `translateY(-4px)` to `translateY(0)` while fading in. On close, it fades out without translation (instant feel).

### 3.10 Toast / Notification
- **Property:** `opacity`, `transform: translateY()`
- **Duration:** Moderate (200ms) for enter, Slow (300ms) for auto-dismiss.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Behaviour:** Slides up from the bottom of the screen by 8px while fading in. Auto-dismisses after 3 seconds by fading out.

### 3.11 Search Results Transition
- **Property:** `opacity`
- **Duration:** Normal (150ms)
- **Easing:** `ease-out`
- **Behaviour:** When the debounced query triggers new results, the list cross-fades. There is no sliding or layout shift — the list simply updates with a subtle opacity transition.

### 3.12 Toggle State (Favorite / Pin)
- **Property:** Fill of the icon SVG
- **Duration:** Instant (0ms)
- **Easing:** None
- **Behaviour:** State toggles are optimistic and instant. The icon swaps from stroke to filled (or vice versa) with zero transition. Delay here would feel sluggish.

### 3.13 Settings Panel Slide
- **Property:** `transform: translateX()`, `opacity`
- **Duration:** Slow (300ms)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Behaviour:** The settings panel slides in from the right edge. On close, it slides back out. The backdrop fades in/out simultaneously.

## 4. Forbidden Animations

- **No bouncing.** Spring animations with overshoot (bounce) feel playful and consumer-grade.
- **No continuous loops.** No pulsing, spinning, or breathing effects on any element at rest.
- **No layout shifts.** Content must never jump or reflow after an animation completes.
- **No parallax.** Desktop applications do not benefit from scroll-based parallax effects.
- **No delays.** Never add an artificial `animation-delay` before a transition begins. Immediate response is paramount.
- **No long animations.** Nothing may exceed 300ms. If it takes longer, it's not an animation — it's a loading state.

## 5. Reduced Motion

ORNAS must respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

When reduced motion is active, all transitions resolve instantly. No exceptions.

---

## See Also

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — Transition duration and easing CSS custom properties
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Per-component animation specifications
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — Reduced motion and `prefers-reduced-motion` requirements
- [BRAND_FOUNDATION.md](../brand/BRAND_FOUNDATION.md) — Animation philosophy (fast, snappy, purposeful)
