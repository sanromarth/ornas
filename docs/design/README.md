# ORNAS — Design System

> **Status:** ✅ Approved
> **Version:** 1.0
> **Last Updated:** 2026-07-19
> **Owner:** ORNAS Core Team
> **Category:** Design System

---

## Philosophy

The ORNAS design system exists to enforce visual consistency across every screen, component, and interaction in the application. It is built on three pillars:

1. **Precision Engineering.** Every pixel serves a purpose. The interface must feel like a high-end physical instrument — fast, reliable, and structurally clear.
2. **Rust-Level Correctness.** Design decisions are not suggestions. They are contracts. A component either conforms to the system or it does not ship.
3. **Contributor Clarity.** Any developer — whether a core maintainer or a first-time contributor — should be able to build a new screen using only these documents, without guessing.

## Goals

- Establish a single, authoritative visual language for the ORNAS desktop application.
- Eliminate design ambiguity so that implementation decisions never require Slack threads or design reviews for standard components.
- Ensure every screen is accessible, keyboard-navigable, and visually consistent by default.
- Provide enough specificity that a contributor unfamiliar with the project can build a production-quality component from documentation alone.

## Desktop-First Philosophy

ORNAS is a **native desktop application**, not a web application. This fundamentally shapes the design system:

- **High density is expected.** Desktop users have large screens, precise pointing devices, and expect to see many items at once. Spacing is tighter than mobile or web defaults.
- **Keyboard-first.** Power users (developers, engineers, writers) interact primarily via keyboard. Every feature must be keyboard-operable. Mouse interactions are secondary.
- **Native window behavior.** The application uses a frameless Tauri window with custom title bar and window controls. It must feel native to Windows, macOS, and Linux simultaneously.
- **No responsive breakpoints.** ORNAS does not use mobile or tablet breakpoints. It uses minimum window constraints and pane collapse rules instead (see `SPACING.md` § Window Behaviour).
- **Dark mode first.** The primary design surface is `#09090B`. Light mode exists as a secondary theme, not an equal partner.

## Source of Truth Hierarchy

The design system exists within a strict document hierarchy. When documents conflict, defer upward.

```
docs/brand/BRAND_FOUNDATION.md            ← Immutable brand identity
    │
    ├── docs/brand/ICON_*.md               ← Icon exploration archive
    │
    └── docs/design/                       ← Implementable design system
            │
            ├── README.md                  ← This file. Entry point.
            ├── DESIGN_TOKENS.md           ← CSS variables, Tailwind config, z-index
            ├── COLOR_SYSTEM.md            ← Palette, semantics, theming
            ├── TYPOGRAPHY.md              ← Font stack, scale, rules
            ├── SPACING.md                 ← Grid, layout, borders, shadows, window
            ├── ICONOGRAPHY.md             ← Icon library, sizing, catalogue
            ├── MOTION.md                  ← Animation tokens, per-component specs
            ├── COMPONENT_GUIDELINES.md    ← Anatomy, states, keyboard, a11y
            └── ACCESSIBILITY.md           ← Global a11y contract, focus order
```

### Relationship with Brand Documentation

`docs/brand/BRAND_FOUNDATION.md` defines **what** ORNAS looks and feels like — personality, color philosophy, typography choices, and design principles. The design system documents define **how** to implement those choices — exact hex values, CSS variables, component specifications, and Tailwind configuration.

Brand documentation is immutable. Design system documents may evolve as new components are added, but must never contradict the brand foundation.

### Relationship with Architecture Documentation

`docs/architecture/` defines the technical architecture — Rust services, SQLite schemas, Tauri commands, React component trees, and folder structure. The design system does not duplicate architectural decisions but references them where relevant:

- **Theme persistence** uses the existing `SettingsService` → `SettingsRepository` → SQLite pipeline (see `COLOR_SYSTEM.md` § Theme Implementation).
- **Component structure** follows the folder hierarchy defined in `docs/architecture/05_FOLDER_STRUCTURE.md`.
- **UI wireframes** in `docs/architecture/07_UI_WIREFRAMES.md` are the structural blueprints; this design system provides the visual specifications to fill those wireframes.

## Document Responsibilities

| Question | Answer In |
| :--- | :--- |
| What color should this button be? | `COLOR_SYSTEM.md` |
| What CSS variable do I use? | `DESIGN_TOKENS.md` |
| What font size for a timestamp? | `TYPOGRAPHY.md` |
| How much padding inside a card? | `SPACING.md` |
| What is the minimum window size? | `SPACING.md` § Window Behaviour |
| Which icon for "delete"? | `ICONOGRAPHY.md` |
| How long should this animation be? | `MOTION.md` |
| What states does a button have? | `COMPONENT_GUIDELINES.md` |
| How does focus move through the app? | `ACCESSIBILITY.md` |
| How does theming work? | `COLOR_SYSTEM.md` § Theme Implementation |
| What z-index should a modal use? | `DESIGN_TOKENS.md` § Z-Index Scale |
| What WCAG level do we target? | `ACCESSIBILITY.md` |

## How to Use This System

### For contributors implementing a component:

1. Read `COMPONENT_GUIDELINES.md` for the component's anatomy, states, and keyboard contract.
2. Use only tokens from `DESIGN_TOKENS.md` in your Tailwind classes. Never hardcode colors, spacing, or z-index values.
3. Use only icons from the approved catalogue in `ICONOGRAPHY.md`.
4. Follow the animation specifications in `MOTION.md` for any transitions.
5. Validate your component against `ACCESSIBILITY.md` before opening a PR.

### For contributors adding a new component:

1. Check if the component already exists in `COMPONENT_GUIDELINES.md`.
2. If not, propose a specification following the same format: **Anatomy → Tokens → States → Keyboard → Accessibility**.
3. The specification must be reviewed and merged before any implementation begins.
4. New components must not introduce tokens, colors, or icons that are not already defined in the system. If a new token is needed, propose it in `DESIGN_TOKENS.md` first.

### For contributors modifying the design system:

1. Changes to `BRAND_FOUNDATION.md` require explicit project owner approval.
2. Changes to design tokens must cascade correctly through all downstream documents.
3. All documents must maintain their version headers.
4. Breaking changes (renamed tokens, removed components) must be documented in the PR description with a migration path.

## Version & Change Policy

- **Current Version:** 1.0
- **Versioning:** The design system uses semantic versioning. Minor versions (1.1, 1.2) add new tokens or components. Major versions (2.0) indicate breaking changes to existing tokens.
- **Change Process:** All modifications to the design system must be submitted as PRs with the `design-system` label. Changes require review from at least one core maintainer.
- **Deprecation:** Tokens or components being removed must be marked as `@deprecated` for one minor version before removal.

---

## See Also

- [BRAND_FOUNDATION.md](../brand/BRAND_FOUNDATION.md) — Immutable brand identity
- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) — CSS variables, Tailwind config, z-index scale
- [COLOR_SYSTEM.md](COLOR_SYSTEM.md) — Color palette, theming architecture
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — Font stack and typographic scale
- [SPACING.md](SPACING.md) — Layout grid, window behavior, elevation
- [ICONOGRAPHY.md](ICONOGRAPHY.md) — Icon library and approved catalogue
- [MOTION.md](MOTION.md) — Animation tokens and component specifications
- [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) — Full component specifications
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — WCAG compliance, focus order, screen readers
