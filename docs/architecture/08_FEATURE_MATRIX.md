# ORNAS — Feature Matrix

> Canonical reference: [ARCHITECTURE_FINAL.md](../ARCHITECTURE_FINAL.md)

---

## Overview

This document maps every feature across all planned versions to its priority,
complexity, implementation status, Rust backend module, and React frontend module.
It is the single cross-reference for tracking what exists, what's in progress,
and what's planned.

**Legend:**

| Column | Values |
|--------|--------|
| **Priority** | `P0` = Must-have for release · `P1` = Should-have · `P2` = Nice-to-have |
| **Complexity** | `S` = Small (1–3 days) · `M` = Medium (4–7 days) · `L` = Large (8+ days) |
| **Status** | `planned` · `in-progress` · `complete` · `shipped` |

---

## V1.0 — Core Clipboard Manager (13 Features)

| # | Feature | Priority | Complexity | Status | Rust Module | React Feature |
|---|---------|----------|-----------|--------|-------------|---------------|
| 1 | Clipboard monitoring + history | P0 | L | planned | `infrastructure/clipboard/monitor.rs`, `native.rs`, `wayland.rs` | `features/clipboard/` |
| 2 | FTS5 instant search | P0 | M | planned | `infrastructure/database/search_repo.rs` | `features/search/` |
| 3 | Smart categorization (16+ types) | P0 | M | planned | `domain/category.rs`, `infrastructure/pipeline/categorizer.rs` | — (auto, backend only) |
| 4 | Duplicate detection | P0 | S | planned | `infrastructure/pipeline/dedup.rs`, `infrastructure/pipeline/hasher.rs` | — (auto, backend only) |
| 5 | Favorites (star/unstar) | P1 | S | planned | `commands/clipboard.rs` (favorite cmd) | `ClipboardItem.tsx`, `useClipboardActions.ts` |
| 6 | Pinned items (stay at top) | P1 | S | planned | `commands/clipboard.rs` (pin cmd) | `ClipboardItem.tsx`, `useClipboardActions.ts` |
| 7 | Quick preview panel | P0 | M | planned | — (data from existing queries) | `ClipboardPreview.tsx` |
| 8 | Image clipboard support | P0 | M | planned | `infrastructure/image_store.rs`, `infrastructure/clipboard/` | `ClipboardPreview.tsx` (image display) |
| 9 | Global search window (Raycast-style) | P0 | L | planned | — (uses existing search backend) | `shared/layouts/SearchWindowLayout.tsx` |
| 10 | Command palette | P1 | M | planned | — (frontend only) | `features/command-palette/` |
| 11 | Keyboard shortcuts (full navigation) | P0 | M | planned | — (frontend only) | `shared/hooks/useHotkey.ts` |
| 12 | Dark mode + light mode | P1 | S | planned | — (frontend only) | `shared/hooks/useTheme.ts`, `styles/globals.css` |
| 13 | Settings (retention, theme, hotkey) | P1 | M | planned | `commands/settings.rs`, `services/settings_service.rs` | `features/settings/` |

### V1.0 Summary

| Metric | Count |
|--------|-------|
| Total features | 13 |
| P0 (must-have) | 8 |
| P1 (should-have) | 5 |
| P2 (nice-to-have) | 0 |
| Small (S) | 4 |
| Medium (M) | 6 |
| Large (L) | 3 |

---

## V1.0 Pipeline Stages

The clipboard pipeline is an internal subsystem, not a user-facing feature.
Listed separately for implementation tracking.

| Stage | Name | Purpose | Rust Module | Complexity |
|-------|------|---------|-------------|-----------|
| 1 | Normalizer | Trim, normalize line endings, NFC, strip nulls | `pipeline/normalizer.rs` | S |
| 2 | Hasher | xxHash64 of normalized content | `pipeline/hasher.rs` | S |
| 3 | Dedup | LRU-500 check → DB fallback → skip or continue | `pipeline/dedup.rs` | S |
| 4 | Categorizer | Regex-based detection (16+ content types) | `pipeline/categorizer.rs` | M |
| 5 | Metadata | Preview, char/line count, source app | `pipeline/metadata.rs` | S |
| 6 | Persister | Image save + SQLite INSERT + FTS5 trigger | `pipeline/persister.rs` | M |
| 7 | Notifier | Emit `clip-created` Tauri event | `pipeline/notifier.rs` | S |

---

## V1.1 — Organization (5 Features)

| # | Feature | Priority | Complexity | Status | Rust Module | React Feature |
|---|---------|----------|-----------|--------|-------------|---------------|
| 14 | Collections UI (CRUD) | P1 | M | planned | `commands/collections.rs`, `services/collection_service.rs`, `database/collection_repo.rs` | `features/collections/` |
| 15 | Tags UI (CRUD) | P1 | M | planned | `commands/tags.rs`, `services/tag_service.rs`, `database/tag_repo.rs` | `features/tags/` |
| 16 | Syntax highlighting | P2 | M | planned | — (frontend only) | `shiki` or `prism` integration in `ClipboardPreview.tsx` |
| 17 | File clipboard support | P1 | L | planned | `infrastructure/clipboard/` (file list detection) | `ClipboardItem.tsx` (file icon/path) |
| 18 | Import / export (JSON) | P1 | M | planned | `commands/export.rs`, `services/export_service.rs` | `features/settings/` (export button) |

### V1.1 Schema Readiness

| Entity | Table Exists in V1.0? | UI in V1.0? | UI Planned |
|--------|----------------------|------------|------------|
| Collections | ✅ `collections`, `clip_collections` | ❌ | V1.1 |
| Tags | ✅ `tags`, `clip_tags` | ❌ | V1.1 |

---

## V1.2 — Productivity (5 Features)

| # | Feature | Priority | Complexity | Status | Rust Module | React Feature |
|---|---------|----------|-----------|--------|-------------|---------------|
| 19 | Snippet manager | P1 | L | planned | `domain/snippet.rs`, `commands/snippets.rs`, `database/snippet_repo.rs` | `features/snippets/` |
| 20 | Timeline view | P2 | M | planned | — (uses existing clip queries with date grouping) | `features/timeline/` |
| 21 | Backup / restore | P1 | M | planned | `services/backup_service.rs` (SQLite backup API) | `features/settings/` (backup button) |
| 22 | Sensitive item auto-expiry | P1 | S | planned | `domain/clip.rs` (add `expires_at`), `services/clipboard_service.rs` (expiry task) | `ClipboardItem.tsx` (expiry badge) |
| 23 | Encrypted favorites | P2 | L | planned | OS keyring + SQLCipher integration | — (transparent to UI) |

---

## V2.0 — Extensibility (4 Features)

| # | Feature | Priority | Complexity | Status | Rust Module | React Feature |
|---|---------|----------|-----------|--------|-------------|---------------|
| 24 | Plugin SDK (WASM sandbox) | P0 | L | planned | `infrastructure/plugins/host.rs`, `wasm_runner.rs` | `features/plugins/` (management UI) |
| 25 | Event bus (broadcast channel) | P0 | M | planned | `infrastructure/events/bus.rs`, `tauri_forwarder.rs` | — (transparent to frontend) |
| 26 | Plugin permissions model | P0 | M | planned | `domain/plugin.rs` (manifest, capabilities) | Plugin install/permission dialog |
| 27 | Plugin UI extensions | P1 | L | planned | `infrastructure/plugins/ui_bridge.rs` | WebView panel injection |

---

## V3.0 — Platform (5 Features)

| # | Feature | Priority | Complexity | Status | Rust Module | React Feature |
|---|---------|----------|-----------|--------|-------------|---------------|
| 28 | Clipboard sync (P2P) | P1 | L | planned | `infrastructure/sync/` (sync engine) | `features/sync/` (status UI) |
| 29 | OCR (image → text) | P2 | L | planned | `infrastructure/pipeline/ocr.rs` (optional stage) | `ClipboardPreview.tsx` (OCR text) |
| 30 | AI categorization (Ollama) | P2 | L | planned | `infrastructure/pipeline/ai_categorizer.rs` | Settings toggle |
| 31 | Quick Notes | P1 | M | planned | `domain/note.rs`, `commands/notes.rs` | `features/notes/` |
| 32 | Automation / workflows | P2 | L | planned | `infrastructure/automation/` (event + action engine) | `features/automation/` |

---

## Cross-Version Summary

| Version | Features | P0 | P1 | P2 | S | M | L |
|---------|----------|----|----|----|----|---|---|
| **V1.0** | 13 | 8 | 5 | 0 | 4 | 6 | 3 |
| **V1.1** | 5 | 0 | 4 | 1 | 0 | 4 | 1 |
| **V1.2** | 5 | 0 | 3 | 2 | 1 | 2 | 2 |
| **V2.0** | 4 | 3 | 1 | 0 | 0 | 2 | 2 |
| **V3.0** | 5 | 0 | 2 | 3 | 0 | 1 | 4 |
| **Total** | **32** | **11** | **15** | **6** | **5** | **15** | **12** |

---

## Module Ownership Map

```mermaid
graph LR
    subgraph "Rust Backend"
        D["domain/"]
        C["commands/"]
        S["services/"]
        I["infrastructure/"]
    end

    subgraph "React Frontend"
        FC["features/clipboard/"]
        FS["features/search/"]
        FCP["features/command-palette/"]
        FST["features/settings/"]
        SH["shared/"]
    end

    D --- C
    C --- S
    S --- I

    FC -.->|IPC| C
    FS -.->|IPC| C
    FST -.->|IPC| C

    FC --> SH
    FS --> SH
    FCP --> SH
    FST --> SH
```

---

## Feature → Tauri Event Mapping

| Feature | Events Produced | Events Consumed |
|---------|----------------|-----------------|
| Clipboard monitoring | `clip-created` | — |
| Favorites | `clip-updated` | — |
| Pinned items | `clip-updated` | — |
| Delete | `clip-deleted` | — |
| Settings | `settings-changed` | — |
| Clipboard list (FE) | — | `clip-created`, `clip-deleted`, `clip-updated` |
| Settings panel (FE) | — | `settings-changed` |

---

## Feature → Database Table Mapping

| Feature | Tables Read | Tables Written |
|---------|------------|---------------|
| Clipboard monitoring | — | `clips`, `clips_fts` |
| FTS5 search | `clips`, `clips_fts` | — |
| Categorization | — | `clips.category` |
| Duplicate detection | `clips.content_hash` | `clips.updated_at` |
| Favorites | `clips.is_favorite` | `clips.is_favorite` |
| Pinned items | `clips.is_pinned` | `clips.is_pinned` |
| Settings | `settings` | `settings` |
| Collections (V1.1) | `collections`, `clip_collections` | `collections`, `clip_collections` |
| Tags (V1.1) | `tags`, `clip_tags` | `tags`, `clip_tags` |

---

> **Tracking Rule:** When a feature's status changes, update this document.
> This matrix is the source of truth for implementation progress across all versions.
