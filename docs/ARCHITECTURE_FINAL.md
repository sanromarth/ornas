# ORNAS — Final Architecture

> **Single Source of Truth**
>
> This document is the definitive architectural reference for ORNAS v1.0.
> All 15 architecture documents will derive from this specification.
> Every decision has been reviewed for simplicity, necessity, and long-term viability.

---

## Table of Contents

1. [Architectural Principles](#1-architectural-principles)
2. [Final V1.0 Feature List](#2-final-v10-feature-list)
3. [Final Technology Stack](#3-final-technology-stack)
4. [Final Dependency List](#4-final-dependency-list)
5. [Final Folder Structure](#5-final-folder-structure)
6. [Final Clean Architecture](#6-final-clean-architecture)
7. [Final Clipboard Pipeline](#7-final-clipboard-pipeline)
8. [Final Event Flow](#8-final-event-flow)
9. [Final Database Schema](#9-final-database-schema)
10. [Final Configuration System](#10-final-configuration-system)
11. [Final Startup Sequence](#11-final-startup-sequence)
12. [Final Memory Budget](#12-final-memory-budget)
13. [Final Performance Budget](#13-final-performance-budget)
14. [Final Keyboard-First UX](#14-final-keyboard-first-ux)
15. [Final Security Model](#15-final-security-model)
16. [Final Compatibility Matrix](#16-final-compatibility-matrix)
17. [Final V2+ Roadmap](#17-final-v2-roadmap)
18. [Things Intentionally NOT Included](#18-things-intentionally-not-included)

---

## 1. Architectural Principles

These are non-negotiable. Every design decision is measured against them.

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Simplicity first** | If two approaches solve the same problem, choose the simpler one. |
| 2 | **Earn complexity** | No abstraction exists without a concrete, current use case. |
| 3 | **Dependencies are liabilities** | Every dependency is a maintenance burden. Justify each one. |
| 4 | **Inward dependency rule** | Dependencies point inward: Infrastructure → Domain ← Application. Domain depends on nothing. |
| 5 | **One responsibility per module** | If you cannot describe a module's purpose in one sentence, split it. |
| 6 | **Keyboard-first** | Every action reachable via keyboard. Mouse is optional. |
| 7 | **Offline-only** | Zero network calls. Ever. No telemetry, no cloud, no analytics. |
| 8 | **Test at the boundary** | Test domain logic with unit tests. Test integration at the repository boundary. Skip UI snapshot tests. |
| 9 | **Ship small, ship fast** | V1.0 is a polished clipboard history tool, not a productivity platform. Platform comes later. |
| 10 | **Open-source friendly** | Small files, clear naming, minimal magic. A new contributor should understand the codebase in one afternoon. |

---

## 2. Final V1.0 Feature List

**13 features. Zero fat.**

| # | Feature | Type | Effort |
|---|---------|------|--------|
| 1 | Clipboard monitoring + history | Core engine | High |
| 2 | FTS5 instant search | Core engine | Medium |
| 3 | Smart categorization (auto-detect 16+ content types) | Pipeline (automatic) | Medium |
| 4 | Duplicate detection | Pipeline (automatic) | Low |
| 5 | Favorites (star/unstar) | Boolean toggle | Low |
| 6 | Pinned items (stay at top) | Boolean toggle | Low |
| 7 | Quick preview panel | UI component | Medium |
| 8 | Image clipboard support (capture + display) | Core engine | Medium |
| 9 | Global search window (Raycast-style hotkey popup) | Signature UX | High |
| 10 | Command palette | Core navigation | Medium |
| 11 | Keyboard shortcuts (full keyboard navigation) | Core UX | Medium |
| 12 | Dark mode + light mode | Theme system | Low |
| 13 | Settings (retention, theme, hotkey, exclusions) | Configuration | Medium |

### What was removed from V1.0 and why

| Feature | Moved To | Reason |
|---------|----------|--------|
| Syntax highlighting | V1.1 | Adds a heavy frontend dependency. Monospace font is sufficient for V1.0. |
| Collections (CRUD UI) | V1.1 | Requires full CRUD interface. Schema is ready; UI is deferred. |
| Tags (CRUD UI) | V1.1 | Same as collections. |
| File clipboard | V1.1 | Complex cross-platform file handling. |
| Import / export | V1.1 | Data portability is important but not for first impression. |
| Timeline view | V1.2 | Visual enhancement. List view is sufficient. |
| Snippet manager | V1.2 | Significant standalone feature with its own CRUD UI. |
| Backup / restore | V1.2 | Manual DB file copy is a workaround until this ships. |
| Encrypted storage | V1.2 | Complex key management. Requires OS keyring integration. |
| Plugin SDK | V2.0 | No users exist yet to demand plugins. Extension points are ready. |

---

## 3. Final Technology Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Runtime** | Tauri | v2 | Lightweight (~10MB binary), native WebView, Rust backend, secure IPC |
| **Frontend** | React | 19 | Component model, ecosystem, developer pool |
| **Language (FE)** | TypeScript | 5.x | Type safety across IPC boundary |
| **Language (BE)** | Rust | 2024 ed. | Memory safety, performance, Tauri requirement |
| **Database** | SQLite via rusqlite | 3.45+ | Embedded, zero-config, FTS5 built-in |
| **Search** | SQLite FTS5 | Built-in | No external search dependency |
| **Client state** | Zustand | 5.x | Minimal (~1KB), TypeScript-first, zero boilerplate |
| **Data state** | TanStack Query | 5.x | Caching + invalidation for Tauri IPC calls |
| **Virtualization** | TanStack Virtual | 3.x | Headless, flexible, actively maintained |
| **Styling** | TailwindCSS | 4.x | Utility-first, design tokens, dark mode built-in |
| **Icons** | Lucide React | Latest | Consistent, tree-shakeable (~200B per icon) |
| **Animation** | CSS transitions | Native | Zero bundle cost. No JS animation library in V1. |
| **Clipboard (primary)** | clipboard-rs | Latest | Multi-format + built-in change monitoring |
| **Clipboard (fallback)** | arboard | Latest | Best Wayland support (feature-gated) |

### Why TanStack Query is kept (not Zustand-only)

The Tauri IPC bridge is an async boundary. Data from Rust is "external" to the React process. TanStack Query provides:

1. **Automatic cache invalidation** when Tauri events signal data changes
2. **Loading + error states** without manual `useState` booleans
3. **Deduplication** of identical IPC calls
4. **staleTime** to prevent redundant re-fetches

Without it, every feature would need ~40 lines of manual state sync boilerplate. With it, each feature needs ~5 lines.

### Why Framer Motion / Motion is removed from V1

V1.0 animations are limited to:
- Hover effects → CSS `transition`
- Panel show/hide → CSS `transition` + `opacity` / `transform`
- List item appearance → CSS `@keyframes`
- Loading spinner → CSS `@keyframes`

None of these require a JavaScript animation library. If layout or exit animations become necessary (V1.1+), **Motion One** (~3KB) is the lightweight alternative to Framer Motion (~30KB).

---

## 4. Final Dependency List

### Rust (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled", "vtab"] }
rusqlite_migration = "1"
clipboard-rs = "0.2"
thiserror = "2"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt"] }
xxhash-rust = { version = "0.8", features = ["xxh64"] }
regex = "1"
tokio = { version = "1", features = ["sync", "time"] }

[target.'cfg(target_os = "linux")'.dependencies]
arboard = { version = "3", features = ["wayland-data-control"] }

[build-dependencies]
tauri-build = "2"
```

**11 direct dependencies** (excluding Tauri plugins and platform-specific deps).

| Dependency | Size Impact | Can It Be Removed? | Verdict |
|------------|------------|-------------------|---------|
| `rusqlite` (bundled) | ~2MB | No — it IS the database | **Keep** |
| `rusqlite_migration` | ~15KB | Could use raw PRAGMA user_version | **Keep** — saves boilerplate |
| `clipboard-rs` | ~50KB | No — core feature | **Keep** |
| `arboard` | ~40KB | Could drop Wayland support | **Keep** — Linux users need it |
| `serde` + `serde_json` | ~200KB | No — required by Tauri IPC | **Keep** |
| `thiserror` | ~5KB | Could use manual `impl Error` | **Keep** — saves boilerplate |
| `tracing` | ~100KB | Could use `log` crate | **Keep** — structured logging, span support |
| `xxhash-rust` | ~10KB | Could use `std::hash::DefaultHasher` | **Keep** — DefaultHasher is not stable across builds |
| `regex` | ~1.5MB | Could use string operations | **Keep** — needed for reliable category detection |
| `tokio` | ~0KB extra | Already included by Tauri | **Keep** — just using `sync` + `time` features |

**No dependency can be removed without losing essential functionality.**

### Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-global-shortcut": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-fs": "^2",
    "@tanstack/react-query": "^5",
    "@tanstack/react-virtual": "^3",
    "zustand": "^5",
    "lucide-react": "latest",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "vite": "^6",
    "@vitejs/plugin-react": "latest",
    "tailwindcss": "^4",
    "postcss": "latest",
    "autoprefixer": "latest",
    "@tanstack/react-query-devtools": "^5"
  }
}
```

**9 runtime dependencies** (excluding Tauri plugin bindings).

| Dependency | Gzipped Size | Can It Be Removed? | Verdict |
|------------|-------------|-------------------|---------|
| `react` + `react-dom` | ~40KB | No — framework | **Keep** |
| `@tanstack/react-query` | ~12KB | Could build manual cache in Zustand | **Keep** — see §3 justification |
| `@tanstack/react-virtual` | ~3KB | Could render all items (kills perf) | **Keep** — essential for 100k+ items |
| `zustand` | ~1KB | Could use React Context | **Keep** — simpler than Context for global state |
| `lucide-react` | ~200B/icon | Could use inline SVGs | **Keep** — consistency + tree-shaking |
| `clsx` | ~200B | Could use template literals | **Keep** — negligible cost, cleaner code |
| `tailwind-merge` | ~5KB | Could avoid conflicting classes | **Keep** — needed for component composition |

**Removed dependencies:**
- ~~`framer-motion`~~ (~30KB) — CSS transitions handle all V1 animations
- ~~syntax highlighting library~~ — deferred to V1.1

---

## 5. Final Folder Structure

```
ORNAS/
│
├── docs/                                    # All architecture + design docs
│   └── architecture/                        # 15 architecture documents
│
├── src-tauri/                               # ═══ RUST BACKEND ═══
│   ├── src/
│   │   │
│   │   ├── commands/                        # APPLICATION: Tauri IPC handlers (thin)
│   │   │   ├── mod.rs
│   │   │   ├── clipboard.rs                 #   list, get, delete, favorite, pin
│   │   │   ├── search.rs                    #   search, suggest
│   │   │   └── settings.rs                  #   get_all, set, get
│   │   │
│   │   ├── services/                        # APPLICATION: Business logic
│   │   │   ├── mod.rs
│   │   │   ├── clipboard_service.rs         #   CRUD orchestration, pruning
│   │   │   ├── search_service.rs            #   FTS5 query + fuzzy re-rank
│   │   │   └── settings_service.rs          #   Defaults, validation
│   │   │
│   │   ├── domain/                          # DOMAIN: Pure business rules (no I/O)
│   │   │   ├── mod.rs
│   │   │   ├── clip.rs                      #   Clip, NewClip, ClipUpdate structs
│   │   │   ├── collection.rs                #   Collection struct (schema ready)
│   │   │   ├── tag.rs                       #   Tag struct (schema ready)
│   │   │   ├── config.rs                    #   AppConfig struct + defaults
│   │   │   ├── category.rs                  #   ContentCategory enum + detection fns
│   │   │   ├── pipeline.rs                  #   PipelineStage trait + StageAction
│   │   │   └── traits.rs                    #   Repository trait definitions
│   │   │
│   │   ├── infrastructure/                  # INFRASTRUCTURE: I/O implementations
│   │   │   ├── mod.rs
│   │   │   ├── database/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── connection.rs            #   Open, PRAGMA, close
│   │   │   │   ├── migrations.rs            #   Versioned schema migrations
│   │   │   │   ├── clip_repo.rs             #   impl ClipRepository for SqliteClipRepo
│   │   │   │   ├── search_repo.rs           #   impl SearchRepository
│   │   │   │   └── settings_repo.rs         #   impl SettingsRepository
│   │   │   ├── clipboard/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── monitor.rs               #   ClipboardMonitor trait + dispatcher
│   │   │   │   ├── native.rs                #   clipboard-rs (Win/Mac/X11)
│   │   │   │   └── wayland.rs               #   arboard fallback (Linux Wayland)
│   │   │   ├── pipeline/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── runner.rs                #   Sequential stage executor
│   │   │   │   ├── normalizer.rs            #   Stage 1
│   │   │   │   ├── hasher.rs                #   Stage 2
│   │   │   │   ├── dedup.rs                 #   Stage 3
│   │   │   │   ├── categorizer.rs           #   Stage 4
│   │   │   │   ├── metadata.rs              #   Stage 5
│   │   │   │   ├── persister.rs             #   Stage 6
│   │   │   │   └── notifier.rs              #   Stage 7
│   │   │   └── image_store.rs               #   Save/load clipboard images
│   │   │
│   │   ├── error.rs                         # AppError enum (thiserror)
│   │   ├── state.rs                         # AppState: all services + repos
│   │   ├── lib.rs                           # App builder, module tree
│   │   └── main.rs                          # Entry point (calls lib::run)
│   │
│   ├── migrations/
│   │   └── 001_initial.sql                  # V1.0 schema (single migration)
│   ├── capabilities/
│   │   ├── main-window.json                 # Full access for main window
│   │   └── search-window.json              # Read-only for search popup
│   ├── icons/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
│
├── src/                                     # ═══ REACT FRONTEND ═══
│   ├── app/
│   │   ├── App.tsx                          # Root: providers + layout
│   │   └── providers.tsx                    # QueryClient + Zustand + Theme
│   │
│   ├── features/                            # Feature modules (isolated)
│   │   ├── clipboard/
│   │   │   ├── components/
│   │   │   │   ├── ClipboardList.tsx        #   Virtualized list
│   │   │   │   ├── ClipboardItem.tsx        #   Single row (React.memo)
│   │   │   │   ├── ClipboardPreview.tsx     #   Detail preview
│   │   │   │   └── EmptyState.tsx           #   First-run state
│   │   │   ├── hooks/
│   │   │   │   ├── useClipboardItems.ts     #   TanStack Query wrapper
│   │   │   │   └── useClipboardActions.ts   #   Copy, delete, favorite
│   │   │   ├── api/
│   │   │   │   ├── queries.ts              #   Read operations
│   │   │   │   ├── mutations.ts            #   Write operations
│   │   │   │   └── keys.ts                 #   Query key factory
│   │   │   ├── store.ts                    #   Zustand slice (selected, viewMode)
│   │   │   └── index.ts                    #   Public barrel export
│   │   │
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSearch.ts
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   │
│   │   ├── command-palette/
│   │   │   ├── components/
│   │   │   │   ├── CommandPalette.tsx
│   │   │   │   └── CommandItem.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCommands.ts
│   │   │   └── index.ts
│   │   │
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── SettingsPanel.tsx
│   │       │   └── SettingRow.tsx
│   │       ├── hooks/
│   │       ├── api/
│   │       └── index.ts
│   │
│   ├── shared/
│   │   ├── components/                      # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── Kbd.tsx                      #   Keyboard shortcut display
│   │   │   └── VirtualList.tsx              #   TanStack Virtual wrapper
│   │   ├── hooks/
│   │   │   ├── useHotkey.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useTauriEvent.ts
│   │   │   └── useTheme.ts
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx               #   Sidebar + content
│   │   │   └── SearchWindowLayout.tsx       #   Floating search popup
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── constants.ts
│   │   │   ├── cn.ts                        #   clsx + twMerge
│   │   │   └── formatters.ts               #   Date, size, relative time
│   │   └── types/
│   │       └── index.ts                     #   Shared TS types
│   │
│   ├── services/                            # Tauri IPC abstraction
│   │   ├── invoke.ts                        # Type-safe invoke wrapper
│   │   ├── clipboard.ts
│   │   ├── search.ts
│   │   └── settings.ts
│   │
│   ├── stores/
│   │   ├── index.ts                         # Combined Zustand store
│   │   ├── ui-store.ts                      # Sidebar, theme, layout
│   │   └── navigation-store.ts             # Keyboard focus position
│   │
│   ├── styles/
│   │   └── globals.css                      # Tailwind directives + CSS vars
│   │
│   └── main.tsx
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── LICENSE                                  # MIT
├── README.md
└── CONTRIBUTING.md
```

### Structural Rules

| Rule | Enforcement |
|------|-------------|
| `domain/` has zero external crate imports | Code review. If `rusqlite` appears in domain, it is a bug. |
| `commands/` never imports `infrastructure/` | Module visibility. Commands use traits from `domain/traits.rs`. |
| Feature modules never import other features' internals | Only import from `feature/index.ts` barrel exports. |
| `shared/` never imports from `features/` | Shared components are feature-agnostic. |
| Every Rust file < 300 lines | If a file exceeds 300 lines, split it. |
| Every React component < 150 lines | Extract logic into hooks if approaching limit. |

---

## 6. Final Clean Architecture

### Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTATION (React)                                     │
│  Components render UI. Hooks manage side effects.         │
│  Knows about: Tauri IPC commands (by name), shared types  │
│  Does NOT know about: Rust internals, SQLite, domain      │
├────────────────────────────┬─────────────────────────────┤
│                     Tauri IPC Bridge                       │
│              (JSON serialization boundary)                 │
├────────────────────────────┴─────────────────────────────┤
│  APPLICATION (commands/ + services/)                      │
│  Commands: validate input, call service, return result     │
│  Services: orchestrate domain logic, coordinate repos     │
│  Knows about: domain traits, domain entities              │
│  Does NOT know about: SQLite, clipboard-rs, filesystem    │
├──────────────────────────────────────────────────────────┤
│  DOMAIN (domain/)                                         │
│  Entities: Clip, Collection, Tag                          │
│  Traits: ClipRepository, SearchRepository, etc.           │
│  Category detection: pure functions, regex                │
│  Pipeline: PipelineStage trait                            │
│  Knows about: NOTHING EXTERNAL (std lib only)             │
├──────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (infrastructure/)                         │
│  Implements domain traits using real I/O                   │
│  SQLite repos, clipboard monitor, image store             │
│  Pipeline stage implementations                           │
│  Knows about: domain traits (implements them)             │
│  Does NOT know about: commands, services                  │
└──────────────────────────────────────────────────────────┘
```

### Why Not Use Cases / DTOs / CQRS?

The original review considered explicit Use Case classes, DTOs, and CQRS patterns. These are **removed** for V1.0:

| Pattern | Decision | Reason |
|---------|----------|--------|
| Use Case classes | ❌ Removed | Each service method IS a use case. Wrapping it in a class adds a file with no logic. |
| DTOs (Data Transfer Objects) | ❌ Removed | Serde `Serialize`/`Deserialize` on domain entities handles serialization. Separate DTOs double the struct count for zero benefit in V1. |
| CQRS | ❌ Removed | Single SQLite database. Read and write paths share the same connection. CQRS adds complexity without benefit. |
| Event Sourcing | ❌ Removed | Clipboard items are mutable (favorite, pin). Event sourcing is for audit trails and financial systems. |
| Event Bus | ❌ Simplified | No formal broadcast channel. Services emit Tauri events directly via `AppHandle`. See §8. |

**The guiding principle:** If a pattern adds a file/struct/layer without adding testability or maintainability, it does not belong in V1.

---

## 7. Final Clipboard Pipeline

### Stage Inventory (7 stages, each < 100 lines)

```
Raw clipboard content (from monitor)
   │
   ▼
┌──────────────────────────────────────────┐
│  Stage 1: NORMALIZER                      │
│  • Trim leading/trailing whitespace       │
│  • Normalize line endings (CRLF → LF)    │
│  • NFC Unicode normalization              │
│  • Strip null bytes                       │
│  • Reject empty / whitespace-only content │
│  Output: cleaned content string           │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 2: HASHER                          │
│  • Compute xxHash64 of normalized content │
│  • Store hash as hex string on ClipItem   │
│  Output: clip.content_hash = "a1b2c3..."  │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 3: DEDUP                           │
│  • Check hash against in-memory LRU (500) │
│  • If LRU miss → check database           │
│  • If duplicate found:                    │
│    → bump existing item's updated_at      │
│    → return StageAction::Skip             │
│  • If unique → add to LRU, continue      │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 4: CATEGORIZER                     │
│  • Run detection functions in order:      │
│    URL → Email → FilePath → JSON → XML →  │
│    Markdown → SQL → Shell → Python → JS → │
│    Rust → HTML → CSS → Git → Docker →     │
│    Phone → PlainText (fallback)           │
│  • First match wins                       │
│  Output: clip.category = "url"            │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 5: METADATA                        │
│  • Generate preview (first 200 chars)     │
│  • Count characters and lines             │
│  • Record source app (platform API)       │
│  • For images: dimensions, byte size      │
│  Output: clip.preview, char_count, etc.   │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 6: PERSISTER                       │
│  • For images: save file to images/ dir   │
│  • INSERT clip into SQLite                │
│  • FTS5 index updated by DB trigger       │
│  Output: clip.id = assigned by DB         │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  Stage 7: NOTIFIER                        │
│  • Emit Tauri event: "clip-created"       │
│  • Payload: { id: clip.id }              │
│  • Frontend TanStack Query invalidates    │
│  Output: UI shows new item at top of list │
└──────────────────────────────────────────┘
```

### Pipeline Contract

```rust
/// Defined in domain/pipeline.rs (no I/O dependencies)
pub trait PipelineStage: Send + Sync {
    fn name(&self) -> &'static str;
    async fn process(&self, item: &mut ClipItem) -> Result<StageAction, PipelineError>;
}

pub enum StageAction {
    Continue,
    Skip { reason: &'static str },
}
```

```rust
/// Defined in infrastructure/pipeline/runner.rs
pub struct PipelineRunner {
    stages: Vec<Box<dyn PipelineStage>>,
}

impl PipelineRunner {
    pub async fn process(&self, item: &mut ClipItem) -> Result<(), PipelineError> {
        for stage in &self.stages {
            match stage.process(item).await? {
                StageAction::Continue => {}
                StageAction::Skip { reason } => {
                    tracing::debug!(stage = stage.name(), reason, "pipeline skipped");
                    return Ok(());
                }
            }
        }
        Ok(())
    }
}
```

### Why not fewer stages?

Every stage was challenged:

| Stage | Can it be merged? | Verdict |
|-------|-------------------|---------|
| Normalizer + Hasher | No — normalization changes content, hash must run after | Separate |
| Hasher + Dedup | No — hashing is pure computation, dedup does I/O (LRU + DB) | Separate |
| Categorizer + Metadata | No — categorization uses regex, metadata uses string counting | Separate |
| Persister + Notifier | Possible — but notification is a cross-cutting concern | Separate for testability |

7 stages is the correct granularity. Each is testable with a single function call.

---

## 8. Final Event Flow

### V1.0: Direct Tauri Event Emission (No Event Bus)

The architecture review proposed a `tokio::broadcast` event bus. This has been **removed** for V1.0.

**Why:** In V1.0, the only event consumer is the React frontend (via Tauri events). A broadcast channel is infrastructure without a second subscriber. It violates Principle #2 (earn complexity).

### How Events Work in V1.0

```
PIPELINE EVENT:
  Notifier stage calls → app_handle.emit("clip-created", id)
                                        ↓
                          Frontend useTauriEvent hook
                                        ↓
                          queryClient.invalidateQueries()
                                        ↓
                          TanStack Query refetches from Rust
                                        ↓
                          UI re-renders

USER ACTION EVENT:
  User clicks delete → invoke("delete_clip", id)
                                        ↓
                          Rust command → service.delete(id) → repo.delete(id)
                                        ↓
                          service calls app_handle.emit("clip-deleted", id)
                                        ↓
                          Frontend useTauriEvent hook
                                        ↓
                          queryClient.invalidateQueries()
```

### V1.0 Tauri Events (exhaustive list)

| Event Name | Emitted By | Payload | Frontend Consumer |
|------------|-----------|---------|-------------------|
| `clip-created` | Notifier stage | `{ id: i64 }` | Invalidate clipboard list queries |
| `clip-deleted` | ClipboardService | `{ id: i64 }` | Invalidate clipboard list queries |
| `clip-updated` | ClipboardService | `{ id: i64 }` | Invalidate specific clip query |
| `settings-changed` | SettingsService | `{ key: String }` | Invalidate settings query |

**4 events. Each has exactly one producer and one consumer.** No event spam, no unused events.

### How This Enables V2 Event Bus

When V2 needs multiple subscribers (plugins, automation), the change is:

1. Add `tokio::broadcast` channel to `AppState`
2. Services emit to broadcast channel instead of directly to `app_handle`
3. Add a `TauriEventForwarder` subscriber that bridges broadcast → Tauri events
4. Plugin host subscribes to the same broadcast channel

Zero changes to domain, pipeline, or frontend code.

---

## 9. Final Database Schema

### Connection Initialization

```rust
// Applied once when the database file is first created
fn init_new_database(conn: &Connection) -> Result<()> {
    // auto_vacuum MUST be set before any tables exist
    conn.execute_batch("PRAGMA auto_vacuum = NONE;")?;
    Ok(())
}

// Applied on EVERY connection open
fn apply_pragmas(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
        PRAGMA foreign_keys = ON;
        PRAGMA cache_size = -16000;
        PRAGMA mmap_size = 268435456;
        PRAGMA temp_store = MEMORY;
    ")?;
    Ok(())
}
```

### PRAGMA Decisions

| PRAGMA | Value | Rationale |
|--------|-------|-----------|
| `journal_mode` | `WAL` | Concurrent reads during writes. Clipboard writes don't block search. |
| `synchronous` | `NORMAL` | Safe with WAL. ~5× faster than `FULL`. |
| `busy_timeout` | `5000` | 5s wait on lock instead of instant `SQLITE_BUSY`. Handles contention gracefully. |
| `foreign_keys` | `ON` | Enforce referential integrity. Off by default in SQLite — must enable. |
| `cache_size` | `-16000` | 16MB page cache. Sufficient for a clipboard DB. Reduced from 64MB (review finding). |
| `mmap_size` | `268435456` | 256MB virtual mapping. OS manages actual resident pages. Improves read performance. |
| `temp_store` | `MEMORY` | Temp tables in RAM. Faster than disk for sort/join buffers. |
| `auto_vacuum` | `NONE` | Best performance. Free pages are reused by new inserts. Manual VACUUM on demand. |

**Why `auto_vacuum = NONE` instead of `INCREMENTAL`:**

Research confirmed `NONE` offers the best write performance and lowest fragmentation for most embedded apps. Since ORNAS inserts frequently (every clipboard copy) and prunes periodically, freed pages are quickly reused by new inserts. The database file naturally stabilizes at a size proportional to the retention window. A manual `VACUUM` is available in Settings → Advanced for users who want to reclaim disk space after a large purge.

### Schema (001_initial.sql)

### Primary Key: INTEGER PRIMARY KEY (no AUTOINCREMENT)

**Decision:** Use `INTEGER PRIMARY KEY` without `AUTOINCREMENT` on all tables.

| Aspect | `INTEGER PRIMARY KEY` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
|--------|----------------------|-------------------------------------|
| ID generation | `max(rowid) + 1` | Strictly monotonic, never reuses |
| Deleted ID reuse | Theoretically possible at `2^63` wraparound | Never |
| Performance | No `sqlite_sequence` table overhead | Slightly slower inserts |
| Practical risk | Zero — clipboard managers will never approach `2^63` (~9.2 quintillion) entries | None |

`AUTOINCREMENT` only prevents rowid reuse after the maximum value (`2^63`) has been reached. For a clipboard manager inserting ~500 items/day, reaching this limit would take approximately **50 quadrillion years**. The `sqlite_sequence` table overhead is unnecessary.

### Timestamp Format: INTEGER Unix Epoch (seconds)

**Decision:** Store all timestamps as `INTEGER` Unix epoch seconds, not `TEXT` ISO-8601.

| Aspect | `INTEGER` (Unix epoch) | `TEXT` (ISO-8601) |
|--------|----------------------|-------------------|
| Storage | 8 bytes | ~27 bytes |
| Sort performance | Integer comparison (~3× faster) | String comparison |
| Range queries | `WHERE created_at < ?` (integer math) | String comparison |
| Human readability | Requires formatting | Readable in DB browser |
| Frontend display | Formatted anyway (`"2m ago"`) | Formatted anyway |

For a table with 100k+ rows sorted by `created_at DESC` on every query, integer comparison provides a measurable performance advantage. The frontend formats all timestamps for display regardless of storage format.

**Epoch precision:** Seconds (not milliseconds). Clipboard events rarely occur within the same second. The auto-incrementing `id` column serves as a natural tiebreaker for simultaneous entries.

```sql
-- ═══════════════════════════════════════════════════════
-- CLIPS: Core clipboard history table
-- ═══════════════════════════════════════════════════════
CREATE TABLE clips (
    id            INTEGER PRIMARY KEY,
    content_text  TEXT,
    content_html  TEXT,
    content_rtf   TEXT,
    image_path    TEXT,
    content_type  TEXT NOT NULL
                  CHECK(content_type IN ('text', 'image', 'rich_text')),
    category      TEXT NOT NULL DEFAULT 'plain_text',
    source_app    TEXT,
    content_hash  TEXT NOT NULL,
    preview       TEXT,
    char_count    INTEGER NOT NULL DEFAULT 0,
    line_count    INTEGER NOT NULL DEFAULT 0,
    is_favorite   INTEGER NOT NULL DEFAULT 0,
    is_pinned     INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_clips_created   ON clips(created_at DESC);
CREATE INDEX idx_clips_hash      ON clips(content_hash);
CREATE INDEX idx_clips_category  ON clips(category);
CREATE INDEX idx_clips_favorites ON clips(created_at DESC) WHERE is_favorite = 1;
CREATE INDEX idx_clips_pinned    ON clips(created_at DESC) WHERE is_pinned = 1;

-- ═══════════════════════════════════════════════════════
-- FTS5: Full-text search index (external content)
-- ═══════════════════════════════════════════════════════
CREATE VIRTUAL TABLE clips_fts USING fts5(
    content_text,
    preview,
    content='clips',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2',
    prefix='2,3'
);

CREATE TRIGGER clips_fts_ai AFTER INSERT ON clips BEGIN
    INSERT INTO clips_fts(rowid, content_text, preview)
    VALUES (new.id, new.content_text, new.preview);
END;

CREATE TRIGGER clips_fts_ad AFTER DELETE ON clips BEGIN
    INSERT INTO clips_fts(clips_fts, rowid, content_text, preview)
    VALUES ('delete', old.id, old.content_text, old.preview);
END;

CREATE TRIGGER clips_fts_au AFTER UPDATE OF content_text, preview ON clips BEGIN
    INSERT INTO clips_fts(clips_fts, rowid, content_text, preview)
    VALUES ('delete', old.id, old.content_text, old.preview);
    INSERT INTO clips_fts(rowid, content_text, preview)
    VALUES (new.id, new.content_text, new.preview);
END;

-- ═══════════════════════════════════════════════════════
-- COLLECTIONS + TAGS: Schema ready, UI deferred to V1.1
-- ═══════════════════════════════════════════════════════
CREATE TABLE collections (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    color       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE clip_collections (
    clip_id       INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, collection_id)
);

CREATE TABLE tags (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE,
    color TEXT
);

CREATE TABLE clip_tags (
    clip_id INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, tag_id)
);

-- ═══════════════════════════════════════════════════════
-- SETTINGS: Key-value application configuration
-- ═══════════════════════════════════════════════════════
CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### Index Justification

| Index | Query It Serves | Used In V1.0? |
|-------|----------------|---------------|
| `idx_clips_created` | `ORDER BY created_at DESC LIMIT N` | ✅ Main list |
| `idx_clips_hash` | `WHERE content_hash = ?` | ✅ Dedup check |
| `idx_clips_category` | `WHERE category = ?` | ✅ Category filter |
| `idx_clips_favorites` | `WHERE is_favorite = 1 ORDER BY created_at DESC` | ✅ Favorites view |
| `idx_clips_pinned` | `WHERE is_pinned = 1 ORDER BY created_at DESC` | ✅ Pinned section |
| ~~idx_clips_type~~ | `WHERE content_type = ?` | ❌ Removed — category filter is sufficient |

**Removed:** `idx_clips_type` from the previous schema. Content type filtering (`text` vs `image`) is rare in V1.0 and can use the category filter instead. One fewer index = faster writes.

### Database Maintenance

| Task | Trigger | Implementation |
|------|---------|---------------|
| **Pruning** | On startup + every 60 minutes | `DELETE FROM clips WHERE is_favorite = 0 AND is_pinned = 0 AND created_at < unixepoch() - (retention_days * 86400)` |
| **FTS5 optimize** | On app shutdown | `INSERT INTO clips_fts(clips_fts) VALUES('optimize');` |
| **PRAGMA optimize** | On app shutdown | `PRAGMA optimize;` |
| **WAL checkpoint** | Every 30 minutes idle | `PRAGMA wal_checkpoint(PASSIVE);` — non-blocking |
| **Manual VACUUM** | User-triggered (Settings) | `VACUUM;` — rewrites DB, reclaims all free space |

### Database Growth Estimation

| Scenario | Entries/Day | Text Size | Images | DB Size at 90 Days |
|----------|------------|-----------|--------|-------------------|
| Light user | 50 copies | ~1KB avg | 2/day | ~5 MB |
| Medium user | 200 copies | ~2KB avg | 10/day | ~40 MB |
| Heavy user | 500 copies | ~3KB avg | 30/day | ~150 MB |

Image files are stored externally and not counted in DB size. FTS5 index adds ~30% overhead to indexed text.

---

## 10. Final Configuration System

### Principle: No Magic Numbers

Every configurable value in ORNAS is defined in a single, typed configuration struct. No hardcoded constants are scattered across the codebase.

### AppConfig (Rust)

```rust
/// Central configuration with typed defaults.
/// Defined in domain/config.rs — no I/O dependencies.
/// Loaded from the settings table on startup; falls back to defaults.
pub struct AppConfig {
    // ── Clipboard ──────────────────────────────────
    /// Polling interval for Wayland fallback monitor (ms)
    pub clipboard_poll_interval_ms: u64,       // default: 500
    /// Debounce window for rapid clipboard changes (ms)
    pub clipboard_debounce_ms: u64,            // default: 100
    /// Apps excluded from clipboard recording
    pub excluded_apps: Vec<String>,            // default: []

    // ── Database ───────────────────────────────────
    /// SQLite page cache size in KB
    pub db_cache_size_kb: u32,                 // default: 16_000
    /// Maximum number of clips to retain
    pub history_max_size: u32,                 // default: 10_000
    /// Days to retain non-favorite, non-pinned clips
    pub retention_days: u32,                   // default: 90
    /// Pruning check interval (seconds)
    pub prune_interval_secs: u64,             // default: 3600

    // ── Search ─────────────────────────────────────
    /// Max results from FTS5 candidate query
    pub search_candidate_limit: u32,           // default: 200
    /// Max results returned to frontend
    pub search_result_limit: u32,              // default: 50
    /// Frontend search debounce (ms)
    pub search_debounce_ms: u64,              // default: 150

    // ── UI ─────────────────────────────────────────
    /// Characters in clip preview
    pub preview_length: usize,                 // default: 200
    /// Entries in dedup LRU cache
    pub dedup_cache_size: usize,              // default: 500
    /// Maximum image file size to capture (bytes)
    pub max_image_size_bytes: u64,            // default: 10_485_760 (10 MB)

    // ── Shortcuts ──────────────────────────────────
    /// Global hotkey to toggle search window
    pub global_shortcut: String,              // default: "CmdOrCtrl+Shift+V"

    // ── Theme ──────────────────────────────────────
    /// Initial theme ("dark" | "light" | "system")
    pub theme: String,                         // default: "system"
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            clipboard_poll_interval_ms: 500,
            clipboard_debounce_ms: 100,
            excluded_apps: vec![],
            db_cache_size_kb: 16_000,
            history_max_size: 10_000,
            retention_days: 90,
            prune_interval_secs: 3600,
            search_candidate_limit: 200,
            search_result_limit: 50,
            search_debounce_ms: 150,
            preview_length: 200,
            dedup_cache_size: 500,
            max_image_size_bytes: 10_485_760,
            global_shortcut: "CmdOrCtrl+Shift+V".into(),
            theme: "system".into(),
        }
    }
}
```

### How Config is Loaded

```
1. AppConfig::default()            ← Compiled-in defaults
         ↓
2. Merge with settings table       ← User overrides from SQLite
         ↓
3. Store in AppState               ← Available to all services
```

Services receive `&AppConfig` via `AppState`. They never hardcode values.

### Frontend Constants

```typescript
// shared/lib/constants.ts — mirrors relevant AppConfig values
export const DEFAULTS = {
  SEARCH_DEBOUNCE_MS: 150,
  PREVIEW_LENGTH: 200,
  SEARCH_RESULT_LIMIT: 50,
  ITEMS_PER_PAGE: 50,
  VIRTUAL_LIST_OVERSCAN: 5,
} as const;
```

Frontend constants that match backend config are kept in sync via the settings API. For values that only exist on the frontend (like `VIRTUAL_LIST_OVERSCAN`), they live in `constants.ts`.

---

## 11. Final Startup Sequence

### What runs at startup (sequential, blocking)

```
1. Parse CLI args                          ~1ms
2. Resolve data directory                  ~1ms
   (~/.local/share/ornas/)
3. Open SQLite database                    ~20ms
   (or create if first run)
4. Apply PRAGMA settings                   ~2ms
5. Run migrations (if needed)              ~50ms (first run only)
6. Build AppState                          ~5ms
   (instantiate services, repos)
7. Start clipboard monitor                 ~5ms
   (spawn background thread)
8. Register Tauri commands                 ~2ms
9. Register global shortcuts               ~5ms
10. Create main window                     ~500-800ms
    (OS WebView initialization)
11. React app mounts                       ~100ms
12. Initial query: fetch first 50 clips    ~30ms
                               ─────────────────
                               Total: ~750-1050ms
```

### What is lazy-loaded (NOT at startup)

| Component | Loaded When |
|-----------|-------------|
| Settings panel | User navigates to settings |
| Command palette | First `Ctrl+Shift+P` press |
| Search window | First global hotkey press |
| Image thumbnails | Scrolled into viewport (IntersectionObserver) |
| FTS5 optimize | App idle for 5+ minutes |
| Pruning task | 10 seconds after startup (background) |

### Startup Budget: 750ms–1050ms ✅ (well under 2s target)

---

## 12. Final Memory Budget

| Component | Idle (MB) | Active (MB) | Notes |
|-----------|----------|-------------|-------|
| Tauri/Rust runtime | 15 | 15 | Binary + tokio runtime |
| OS WebView | 40 | 45 | Platform native (not Chromium) |
| React app + virtual DOM | 8 | 12 | Components, hooks, state |
| SQLite connection | 1 | 1 | Connection overhead |
| SQLite page cache | 16 | 16 | `cache_size = -16000` (fixed) |
| Clipboard monitor thread | 2 | 2 | Thread stack + read buffer |
| LRU dedup cache | 0.5 | 0.5 | 500 entries × ~1KB hash |
| TanStack Query cache | 2 | 5 | Cached query results |
| Zustand store | 0.1 | 0.1 | Tiny — a few booleans and IDs |
| Image thumbnails | 0 | 3 | Loaded on demand |
| **Total** | **~85 MB** | **~100 MB** | **Well under 250 MB target** |

### Memory Reduction Opportunities (if needed)

| Optimization | Saves | Trade-off |
|-------------|-------|-----------|
| Reduce page cache to `-8000` (8MB) | ~8 MB | Slightly more disk I/O |
| Limit TanStack Query cache to 2 pages | ~2 MB | More re-fetches on navigation |
| Reduce LRU to 200 entries | ~0.3 MB | More DB lookups for dedup |

Current baseline (~85 MB idle) is lightweight enough. No further optimization is needed.

---

## 13. Final Performance Budget

| Metric | Target | Expected | How |
|--------|--------|----------|-----|
| Cold start | < 2s | ~1s | Tauri native, lazy UI, no splash |
| Warm start | < 500ms | ~300ms | OS process cache, WAL fast-open |
| Search latency (10k items) | < 50ms | ~20ms | FTS5 MATCH + prefix index |
| Search latency (100k items) | < 100ms | ~60ms | FTS5 + fuzzy re-rank top 200 |
| Clipboard capture | < 20ms | ~10ms | Event-driven + async pipeline |
| List scroll FPS | 60 FPS | 60 FPS | TanStack Virtual + React.memo |
| Memory (idle) | < 150 MB | ~85 MB | Native WebView, bounded caches |
| Memory (active) | < 250 MB | ~100 MB | Virtual scrolling, no image preload |
| Binary size | < 15 MB | ~10 MB | Tauri + bundled SQLite |
| Database size (90d, medium) | < 100 MB | ~40 MB | Text-only DB, images external |

### Search Performance Strategy

```
User types "json"
   ↓  debounce 150ms
Frontend invoke("search", { query: "json" })
   ↓  Tauri IPC (~1ms)
SearchService.search("json")
   ↓
SQL: SELECT * FROM clips WHERE id IN (
       SELECT rowid FROM clips_fts WHERE clips_fts MATCH 'json*'
     ) ORDER BY rank LIMIT 200
   ↓  FTS5 lookup (~5ms for 100k entries)
Rust fuzzy re-rank top 200 → return top 50
   ↓  (~3ms)
JSON serialize + IPC return
   ↓  (~2ms)
TanStack Query caches result
   ↓
React renders 50 items (virtual list shows ~20)
   ↓  (~5ms)
Total: ~16ms (perceived as instant)
```

---

## 14. Final Keyboard-First UX

### Global Shortcuts (system-wide, configurable)

| Default Shortcut | Action |
|-----------------|--------|
| `Ctrl+Shift+V` | Toggle ORNAS search window |

### App Shortcuts (when ORNAS is focused)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+K` or `/` | Focus search bar | Any view |
| `↑` / `↓` | Navigate list items | Clipboard list |
| `Enter` | Copy selected item to system clipboard | Clipboard list |
| `Space` | Toggle preview panel | Clipboard list |
| `Ctrl+F` | Toggle favorite on selected item | Clipboard list |
| `Ctrl+Shift+P` | Open command palette | Any view |
| `Delete` | Delete selected item | Clipboard list |
| `Escape` | Close panel / clear search / close window | Any view |
| `Tab` | Move focus between sidebar → list → preview | Any view |
| `Ctrl+,` | Open settings | Any view |
| `1`–`9` | Quick-copy item at position N | Clipboard list |
| `Ctrl+Shift+D` | Toggle dark/light mode | Any view |

### Navigation Model

```
┌─────────────────────────────────────────────────────┐
│  Global Search Window (Ctrl+Shift+V)                │
│  ┌─────────────────────────────────────────────┐    │
│  │  🔍 Search...                          [Esc] │    │
│  ├─────────────────────────────────────────────┤    │
│  │  ▸ Most recent clip                    [1]   │    │
│  │    Second clip                         [2]   │    │
│  │    Third clip                          [3]   │    │
│  │    ...                                       │    │
│  └─────────────────────────────────────────────┘    │
│  Enter → copy + close    ↑↓ → navigate              │
└─────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│  Main Window                                                  │
│  ┌────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│  │Sidebar │ │  Clipboard List      │ │  Preview Panel       │ │
│  │        │ │                      │ │                      │ │
│  │ All    │ │  🔍 Search...        │ │  [Content preview]   │ │
│  │ Fav ★  │ │                      │ │                      │ │
│  │ Pinned │ │  ▸ Item 1  ★  📌    │ │  Category: URL       │ │
│  │        │ │    Item 2            │ │  Copied: 2m ago      │ │
│  │ ─────  │ │    Item 3            │ │  Source: Firefox     │ │
│  │ Types  │ │    Item 4            │ │  Chars: 142          │ │
│  │  Text  │ │    ...               │ │                      │ │
│  │  Code  │ │                      │ │  [Copy] [Delete]     │ │
│  │  URLs  │ │                      │ │  [Favorite] [Pin]    │ │
│  │  Image │ │                      │ │                      │ │
│  └────────┘ └──────────────────────┘ └─────────────────────┘ │
│  [Tab]       [↑↓ navigate]           [Space toggle]          │
└──────────────────────────────────────────────────────────────┘
```

### Focus Flow

1. **Window opens** → search bar focused
2. **User types** → results filter in real-time
3. **User presses ↓** → focus moves to first result, search bar stays filled
4. **User presses Enter** → item copied to clipboard
5. **In global search mode** → window also closes after copy
6. **User presses Escape** → clears search OR closes panel OR closes window (cascading)

### Command Palette

Activated via `Ctrl+Shift+P`. Follows VS Code pattern:

```
┌──────────────────────────────────────┐
│  > Search commands...                 │
├──────────────────────────────────────┤
│  Clear All History                    │
│  Toggle Dark Mode                     │
│  Show Favorites Only                  │
│  Show Pinned Only                     │
│  Filter by Category...                │
│  Open Settings                        │
│  About ORNAS                          │
└──────────────────────────────────────┘
```

---

## 15. Final Security Model

### Threat Analysis (V1.0 Scope)

| Threat | Severity | Mitigation |
|--------|----------|-----------|
| Passwords captured from clipboard | High | App exclusion list (1Password, Bitwarden, KeePass). Configurable in Settings. |
| XSS via clipboard content in WebView | Medium | Strict CSP. All content rendered as escaped text, never as raw HTML. Preview uses `textContent`, not `innerHTML`. |
| Unauthorized Tauri command access | Medium | Capability files scope permissions per window. Search window is read-only. |
| Malicious data in clipboard | Low | Pipeline normalizer strips null bytes and validates encoding. No `eval()` or dynamic execution anywhere. |
| Database file exfiltration | Low | Standard OS file permissions (`0600`). V1.2 adds optional encryption. |
| Supply chain attack | Low | Minimal dependencies (11 Rust, 9 JS). `cargo audit` + `npm audit` in CI. Pin dependency versions. |

### Privacy Controls

| Control | Default | Configurable |
|---------|---------|-------------|
| Telemetry | OFF (no telemetry code exists) | N/A |
| Network access | NONE (no network code exists) | N/A |
| App exclusion list | Empty | Yes — Settings |
| Retention period | 90 days | Yes — 7/30/90/365/unlimited |
| Clear on exit | OFF | Yes — Settings |
| Max history size | 10,000 items | Yes — Settings |
| Max image size | 10 MB | Yes — Settings |

### Tauri Capabilities

**Main window** — full access to all app commands:
```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default", "core:event:default", "core:window:default",
    "global-shortcut:default", "dialog:default",
    { "identifier": "fs:default", "allow": [{ "path": "$APPDATA/**" }] }
  ]
}
```

**Search window** — read-only, no file system, no dialog:
```json
{
  "identifier": "search-capability",
  "windows": ["search"],
  "permissions": ["core:default", "core:event:default"]
}
```

---

---

## 16. Final Compatibility Matrix

### Supported Platforms

| Platform | Version | WebView Engine | Status |
|----------|---------|---------------|--------|
| **Linux** | Ubuntu 22.04+, Fedora 38+, Arch (rolling) | WebKitGTK 4.1+ | ✅ Primary |
| **Windows** | Windows 10 (1803+), Windows 11 | WebView2 (Edge Chromium) | ✅ Primary |
| **macOS** | macOS 12 (Monterey)+ | WKWebView | ✅ Primary |

### Linux Desktop Requirements

| Component | X11 | Wayland |
|-----------|-----|--------|
| Clipboard engine | `clipboard-rs` (native) | `arboard` (fallback) |
| Global shortcuts | ✅ Supported | ⚠️ Compositor-dependent |
| Tray icon | ✅ Supported | ⚠️ Requires `libappindicator` |

### Toolchain Versions

| Tool | Minimum | Recommended |
|------|---------|-------------|
| **Rust** | 1.77.0 (2024 edition) | Latest stable |
| **Node.js** | 20 LTS | 22 LTS |
| **npm** | 10+ | Latest |
| **Tauri CLI** | 2.0 | Latest 2.x |
| **SQLite** | 3.45 (bundled via rusqlite) | N/A (compiled in) |

### Minimum Hardware

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | x86_64 or ARM64, 2 cores | 4+ cores |
| **RAM** | 256 MB available | 512 MB available |
| **Disk** | 50 MB (binary + empty DB) | 500 MB (including clipboard history) |
| **Display** | 1280×720 | 1920×1080 |

### Build Dependencies

| Platform | Required System Packages |
|----------|--------------------------|
| **Linux (Debian/Ubuntu)** | `build-essential`, `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `libxdo-dev` |
| **Linux (Fedora)** | `webkit2gtk4.1-devel`, `gtk3-devel`, `libappindicator-gtk3-devel`, `librsvg2-devel`, `libxdo-devel` |
| **macOS** | Xcode Command Line Tools |
| **Windows** | Visual Studio Build Tools 2019+, WebView2 Runtime |

---

## 17. Final V2+ Roadmap

### V1.1 — Organization (Est. 4–6 weeks after V1.0)

| Feature | Depends On |
|---------|-----------|
| Collections UI (create, manage, assign clips) | Schema ready in V1.0 |
| Tags UI (create, assign, filter) | Schema ready in V1.0 |
| Syntax highlighting in preview | Add `shiki` or `prism` frontend dep |
| File clipboard support | clipboard-rs file list reading |
| Import / export (JSON format) | ClipRepository::list_all |

### V1.2 — Productivity (Est. 4–6 weeks after V1.1)

| Feature | Depends On |
|---------|-----------|
| Snippet manager (CRUD UI + shortcuts) | New `snippets` table + feature module |
| Timeline view | New visualization component |
| Backup / restore (automated) | SQLite backup API |
| Sensitive item auto-expiry | New `expires_at` column + background task |
| Encrypted favorites storage | OS keyring + SQLCipher or AES-256-GCM |

### V2.0 — Extensibility (Est. 8–12 weeks after V1.2)

| Feature | Depends On |
|---------|-----------|
| Plugin SDK (WASM sandbox) | wasmtime, plugin manifest, lifecycle hooks |
| Event bus (broadcast channel) | `tokio::broadcast`, event forwarder |
| Plugin permissions model | Capability-based, declared in manifest |
| Plugin UI extensions | Webview panels for plugin content |

### V3.0+ — Platform (Future)

| Feature | Depends On |
|---------|-----------|
| Clipboard sync (P2P or relay) | Sync engine, conflict resolution |
| OCR (image → text) | Optional pipeline stage, Tesseract or similar |
| Local AI categorization (Ollama) | HTTP client, optional pipeline stage |
| Quick Notes | New entity, new feature module |
| Automation / workflows | Event subscriptions + action engine |

---

## 18. Things Intentionally NOT Included

Every item below was consciously evaluated and rejected for V1.0.

### Architecture Decisions

| Omission | Reason |
|----------|--------|
| **Event bus / broadcast channel** | Only one subscriber exists in V1.0 (Tauri event bridge). Direct emission is simpler. |
| **Use Case classes** | Each service method is a use case. Wrapping in a class adds files with zero logic. |
| **DTOs** | Serde on domain entities handles serialization. Separate DTOs double struct count. |
| **CQRS** | Single database. Read and write paths share one connection. No benefit. |
| **Event sourcing** | Clipboard items are mutable (favorite, pin). Not an audit system. |
| **Plugin SDK** | No users demand it yet. Traits + pipeline stages are the extension points. |
| **WASM sandbox** | Plugin runtime. Deferred to V2.0. |
| **Repository factory / DI container** | Rust constructors are simple. No need for a DI framework. |
| **ORM** | `rusqlite` with handwritten SQL is more debuggable and performant than an ORM for this use case. |
| **Multi-database** | One SQLite file. No sharding, no multi-tenant, no read replicas. |

### Technology Decisions

| Omission | Reason |
|----------|--------|
| **Framer Motion** | CSS transitions handle all V1.0 animations. 30KB saved. |
| **Syntax highlighting library** | Deferred to V1.1. Monospace font is acceptable for V1.0. |
| **SQLCipher** | Database encryption deferred to V1.2. Adds build complexity. |
| **i18n library** | V1.0 is English only. i18n adds string management overhead. |
| **E2E testing framework** | V1.0 tests at unit and integration level. E2E adds CI complexity. |
| **Storybook** | 13 shared components don't justify a Storybook setup. |
| **Monorepo tooling (nx, turbo)** | Single package. No workspace management needed. |
| **Docker** | Desktop app. No containerization. |
| **CI/CD** | GitHub Actions for lint + test + build. Simple YAML, no complex pipelines. |
| **Auto-updater** | Tauri has built-in updater, but V1.0 ships without it. Manual updates. |

### Feature Decisions

| Omission | Reason |
|----------|--------|
| **Cloud sync** | Requires server infrastructure or P2P protocol. V3.0. |
| **OCR** | Heavy dependency (Tesseract). Optional module for V2.0+. |
| **AI categorization** | Ollama integration is optional. Regex-based detection is sufficient. |
| **Rich text editing** | ORNAS is a clipboard viewer, not an editor. |
| **Custom themes** | Dark + light is sufficient. Custom themes add CSS variable management. |
| **Multi-window clipboard** | One main window + one search popup. No dashboard views. |
| **Tray icon menu** | Tray icon exists for background presence. Context menu deferred. |
| **Drag and drop** | Clipboard items can be copied, not dragged. Simplifies interaction model. |
| **Undo/redo** | Delete is permanent in V1.0. Undo requires action history tracking. |
| **Clipboard sharing** | Network feature. V3.0. |

---

> **This document is complete.**
>
> It is the single source of truth for ORNAS v1.0 architecture.
> All 15 architecture documents will derive from this specification.
> No implementation code will be generated until all documents are reviewed.
