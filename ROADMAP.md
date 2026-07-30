# ORNAS Roadmap

This document outlines the high-level direction for ORNAS. It reflects features that are fully implemented, planned for the next minor release, and ideas under consideration for the future.

---

## Completed in v1.0

All core features are complete and stable:

- **Clipboard Monitoring Pipeline** — Reliable, continuous capture of text, HTML, RTF, images, and files across all platforms.
- **Full-text Search** — Sub-millisecond search across thousands of clipboard items using SQLite FTS5.
- **Smart Categorization** — Automatic detection of 16+ content types (code, links, JSON, SQL, emails, and more).
- **Code Preview** — Native syntax highlighting for 20+ programming languages.
- **Rich Content Preview** — HTML, Markdown, and images rendered natively in the preview panel.
- **Collections** — Custom folder-like groups for clipboard items.
- **Tags** — Labels for flexible organization.
- **Favorites** — Pin important clipboard items for quick access.
- **Vault** — XChaCha20-Poly1305 encryption for sensitive items, Argon2id key derivation.
- **Keyboard-First Workflow** — Command palette, fully customizable shortcuts, cheat sheet, and list navigation.
- **Bulk Actions** — Multi-select with Shift/Ctrl, bulk favorite, pin, or delete.
- **Data Safety** — Offline-first SQLite storage with WAL mode, automated background backups, and robust recovery tools.
- **Accessibility** — Full keyboard navigation, ARIA labels, live regions, reduced-motion support.
- **Cross-platform releases** — Linux, macOS, and Windows support.
- **Release automation** — Automated GitHub Actions CI/CD pipelines.

---

## Planned for v1.1

Under active consideration — not committed:

- **Tag Colors** — Color-coded sidebar tags for faster visual organization.
- **Timeline View** — Chronological visualization of clipboard history grouped by day.
- **Inline Tagging** — Assign tags directly from the preview panel without opening a dialog.
- **Code Preview Theme Parity** — Custom PrismJS theme matched to the ORNAS Zinc palette for both dark and light modes.
- **Loading State Refinement** — Upgrade the infinite-scroll "Loading more…" indicator from plain text to a styled spinner.

---

## Future

These ideas are under consideration for future major updates. They are not currently in active development:

- **Snippet Manager** — Save frequently used items as permanent named templates with quick-insert shortcuts.
- **File System Integration** — Full bidirectional file clipboard support with previews and metadata.
- **Plugin System** — Allow community extensions for custom content types and preview renderers.
- **Sharing** — Export selected clipboard items as a formatted bundle for sharing with teammates (local-only, no cloud).
