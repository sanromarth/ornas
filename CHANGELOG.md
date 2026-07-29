# Changelog

All notable changes to ORNAS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc1] — 2026-07-29

First public Release Candidate. The application is feature-complete, architecturally stable, and considered production-quality.

### Architecture

- Clean architecture strictly enforced: commands → services → domain traits → infrastructure. No layer bleeds into another.
- Trait-based repository pattern throughout (`ClipRepository`, `SearchRepository`, `SettingsRepository`, `CollectionRepository`, `TagRepository`, `VaultRepository`).
- Single unified `AppError` enum with `thiserror` — all fallible functions return `Result<T, AppError>`.
- Thread-safe `AppState` with all fields `Send + Sync`, managed by Tauri's `manage()`.

### Clipboard Engine

- 7-stage processing pipeline: Normalize → Hash → Dedup → Categorize → Metadata → Persist → Notify.
- Deduplication via xxHash64 LRU cache (configurable size) with SQLite fallback — survives restarts.
- Background image processing via bounded crossbeam channel (50 jobs) with `catch_unwind` fault isolation.
- Automatic clipboard monitoring on dedicated threads, separate from the Tauri event loop.

### Database

- SQLite in WAL mode (`synchronous = NORMAL`, `busy_timeout = 5000ms`, `foreign_keys = ON`).
- 8 versioned migrations compiled into the binary via `include_str!` — atomic, never partially apply.
- Startup integrity check (`PRAGMA quick_check`, `PRAGMA foreign_key_check`) with automatic corruption recovery.
- FTS5 full-text search with optimized indexing and rebuild support.

### Security

- Encrypted Vault: XChaCha20-Poly1305 encryption, Argon2id key derivation (OWASP minimum parameters).
- Master key held only in memory, wrapped in `Zeroizing<[u8; 32]>` — memory zeroed on lock.
- DOMPurify sanitization on all HTML clipboard content before rendering.
- CSP enforced via Tauri configuration. Asset protocol scoped to `$APPDATA/**` only.

### Search

- Sub-millisecond full-text search via SQLite FTS5.
- 150ms debounce on the search input — backend is queried only after the user pauses typing.
- Live screen-reader region announces result count after each search.
- Down Arrow key in search bar transfers focus directly to the list.

### Preview Panel

- Lazy-loaded content renderers for each type: code (PrismJS), HTML (DOMPurify + iframe), Markdown, images, plain text.
- Consistent 24px horizontal grid across toolbar, content body, and metadata strip.
- Inline copy-success state (`Copied ✓`) with token-based color feedback.

### Collections & Tags

- Create, rename, and delete collections and tags from the sidebar.
- Assign clips to multiple collections and tags from the preview panel.
- Filter the clipboard list by a single collection or tag with item count badges.
- Bulk assign selected clips to a collection or tag in one action.

### Performance

- Virtualized list (`@tanstack/react-virtual`, `estimateSize: 56px`) — 10,000 entries render identically to 100.
- `React.memo` on all expensive components. Granular Zustand selectors prevent unnecessary re-renders.
- `requestAnimationFrame` throttling on panel resize eliminates layout thrashing.
- Release profile: `lto = true`, `codegen-units = 1`, `strip = true`, `panic = "abort"`.

### Accessibility

- Full keyboard-only workflow: Tab, Arrow keys, Space, Enter, Escape, Ctrl+K all wired throughout.
- `focus-visible` rings on all interactive elements. Focus trap in all dialogs.
- `aria-label` on all icon buttons. `aria-current="page"` on active nav items. `aria-live` on search and toast regions.
- `@media (prefers-reduced-motion: reduce)` collapses all animations to 0.01ms globally.

### Design System

- Zinc/Indigo semantic token system. No raw Tailwind colors in production components.
- Consistent 44px height rhythm for Toolbar, SearchBar, and Preview Toolbar.
- Inter (variable) for UI, JetBrains Mono for code. All fonts self-hosted — no external requests.
- Dark and light themes, automatic system theme detection.

### Keyboard & Power User Features

- Command Palette (`Ctrl+Shift+P`) — searchable action registry with keyboard shortcut hints.
- Cheat Sheet (`Ctrl+/`) — full keyboard shortcut reference, always available.
- Action Registry — every application action registered once, routed from keyboard, toolbar, palette, and menu.
- Shortcut Registry — fully customizable key bindings with conflict detection, import, and export.

### Documentation & Open Source

- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `PRIVACY.md`, `SIGNING.md`, `ROADMAP.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` all present and current.
- Issue templates, PR template, CODEOWNERS, and FUNDING.yml configured.
- Architecture documented in `docs/ARCHITECTURE_FINAL.md`.

### Packaging & Release

- Cross-platform CI: Linux (`.deb`, `.rpm`, `.AppImage`), Windows (`.msi`, `.exe`), macOS Apple Silicon and Intel (`.dmg`).
- `fail-fast: false` — one platform failure does not cancel other builds.
- Releases draft before publish — maintainer review required.
- Windows and macOS binaries are currently unsigned. See [SIGNING.md](SIGNING.md).

---

## Historical Releases

### [0.9.1-beta] — 2026-07-27

- Flagship Desktop UI: Responsive three-panel layout, panel splitters, search toolbar, smart sidebar, micro-interactions.
- Command Palette and searchable Cheat Sheet.
- Editable shortcut preferences with live capture, conflict resolution, and JSON import/export.
- Destructive action confirmation dialogs with clip content preview.
- Settings dialog expanded with desktop-native sidebar navigation.
- Critical drag/resize performance regression fixed via `requestAnimationFrame` throttling and `React.memo`.

### [0.9.0-beta] — 2026-07-23

- Project foundation: Tauri v2 + React 19 + TypeScript 5 + Rust 2024 edition.
- Clean architecture: commands → services → domain → infrastructure.
- Backup & restore system (JSON + binary assets in a ZIP archive).
- SQLite schema with FTS5 full-text search.
- 7-stage clipboard processing pipeline (trait-based).
- TailwindCSS v4 with dark/light theme tokens.
- Zustand stores, TanStack Query integration, feature-based frontend architecture.
- Full tooling: ESLint v9, Prettier, rustfmt, Clippy, EditorConfig.
