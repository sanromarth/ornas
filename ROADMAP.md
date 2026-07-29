# ORNAS Roadmap

This document outlines the high-level direction for ORNAS beyond v1.0.0-rc1.

---

## Shipped — v1.0.0-rc1

All core features are complete and stable:

- **Clipboard Monitoring Pipeline** — Reliable, continuous capture of text, HTML, RTF, images, and files across all platforms.
- **FTS5 Instant Search** — Sub-millisecond full-text search across thousands of clipboard items.
- **Smart Categorization** — Automatic detection of 16+ content types (code, links, JSON, SQL, emails, and more).
- **Code Preview with Syntax Highlighting** — Native rendering for 20+ programming languages via PrismJS.
- **HTML, Markdown, and Image Preview** — Rich content rendered natively in the preview panel.
- **Collections & Tags** — Custom organizational structure for clipboard items.
- **Encrypted Vault** — AES-256 (XChaCha20-Poly1305) encryption for sensitive clips, Argon2id key derivation.
- **Keyboard-First Workflow** — Command palette, fully customizable shortcuts, cheat sheet, and list navigation.
- **Bulk Actions** — Multi-select with Shift/Ctrl, bulk favorite, pin, or delete.
- **Data Safety** — Offline-first SQLite storage with WAL mode, automated background backups, and robust recovery tools.
- **Accessibility** — Full keyboard navigation, ARIA labels, live regions, reduced-motion support.
- **Visual Design** — Professional three-panel desktop UI, Zinc/Indigo design system, dark and light themes.

---

## v1.1 (Next Minor)

Under active consideration — not committed:

- **Tag Colors** — Color-coded sidebar tags for faster visual organization.
- **Timeline View** — Chronological visualization of clipboard history grouped by day.
- **Inline Clip Tagging** — Assign tags directly from the preview panel without opening a dialog.
- **Code Preview Theme Parity** — Custom PrismJS theme matched to the ORNAS Zinc palette for both dark and light modes.
- **Loading State Refinement** — Upgrade the infinite-scroll "Loading more…" indicator from plain text to a styled spinner.

---

## Future Exploration — v1.x+

These ideas are under consideration for future major updates. They are not currently in active development:

- **Snippet Manager** — Save frequently used items as permanent named templates with quick-insert shortcuts.
- **File System Integration** — Full bidirectional file clipboard support with previews and metadata.
- **Plugin System** — Allow community extensions for custom content types and preview renderers.
- **Sharing** — Export selected clips as a formatted bundle for sharing with teammates (local-only, no cloud).
