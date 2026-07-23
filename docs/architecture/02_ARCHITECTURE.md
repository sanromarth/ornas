# ORNAS — System Architecture

> Canonical reference: [ARCHITECTURE_FINAL.md](../ARCHITECTURE_FINAL.md)

---

## 1. System Overview Diagram

```mermaid
graph TB
    subgraph PRESENTATION["Presentation Layer (React 19)"]
        UI[React Components]
        ZS[Zustand Store]
        TQ[TanStack Query Cache]
        TV[TanStack Virtual]
    end

    subgraph IPC_BRIDGE["Tauri IPC Bridge"]
        INV["invoke() — JSON serialization"]
        EVT["listen() — Tauri events"]
    end

    subgraph APPLICATION["Application Layer (Rust)"]
        CMD[Commands Module]
        SVC[Services Module]
    end

    subgraph DOMAIN["Domain Layer (Pure Rust — no I/O)"]
        ENT["Entities: Clip, Collection, Tag"]
        TRT["Traits: ClipRepository, SearchRepository"]
        PIP["PipelineStage trait"]
        CAT["ContentCategory detection"]
        CFG["AppConfig defaults"]
    end

    subgraph INFRASTRUCTURE["Infrastructure Layer (Rust I/O)"]
        DB["SQLite (rusqlite)"]
        FTS["FTS5 Search Index"]
        CLM["Clipboard Monitor"]
        IMG["Image Store"]
        PLR["Pipeline Runner"]
        MIG["Migrations (rusqlite_migration)"]
    end

    UI --> |"invoke(cmd, args)"| INV
    INV --> CMD
    CMD --> SVC
    SVC --> TRT
    TRT -. "implemented by" .-> DB
    TRT -. "implemented by" .-> FTS
    SVC --> PIP
    PIP -. "implemented by" .-> PLR
    PLR --> DB
    PLR --> IMG
    CLM --> |"raw clipboard event"| PLR
    PLR --> |"emit clip-created"| EVT
    EVT --> TQ
    TQ --> |"refetch"| INV
    SVC --> |"emit events"| EVT
    DB --> MIG
```

---

## 2. Clean Architecture Layers

### Dependency Rule

> Dependencies point **inward only**: Infrastructure → Domain ← Application.
> Domain depends on **nothing external** (std lib only).

```mermaid
graph LR
    subgraph Outer["Infrastructure"]
        direction TB
        I1[database/]
        I2[clipboard/]
        I3[pipeline/]
        I4[image_store.rs]
    end

    subgraph Middle["Application"]
        direction TB
        M1[commands/]
        M2[services/]
    end

    subgraph Inner["Domain"]
        direction TB
        D1["entities (clip, tag, collection)"]
        D2["traits (repository definitions)"]
        D3["pipeline trait"]
        D4["category detection"]
        D5["config defaults"]
    end

    Outer -->|"implements traits from"| Inner
    Middle -->|"uses traits from"| Inner
    Middle -.x|"NEVER imports"| Outer
```

### Layer Responsibilities

| Layer | Location | Responsibilities | Knows About | Does NOT Know About |
|-------|----------|-----------------|-------------|---------------------|
| **Presentation** | `src/` (React) | Render UI, manage side effects via hooks | Tauri IPC commands (by name), shared TS types | Rust internals, SQLite, domain |
| **Application** | `src-tauri/src/commands/` + `services/` | Validate input, call services, orchestrate domain logic | Domain traits, domain entities | SQLite, clipboard-rs, filesystem |
| **Domain** | `src-tauri/src/domain/` | Define entities, traits, pure business rules | Nothing external (std lib only) | Everything else |
| **Infrastructure** | `src-tauri/src/infrastructure/` | Implement domain traits using real I/O | Domain traits (to implement them) | Commands, services |

### Module Inventory

| Module | Layer | File | One-Sentence Purpose |
|--------|-------|------|---------------------|
| `commands::clipboard` | Application | `commands/clipboard.rs` | Thin IPC handler: list, get, delete, favorite, pin |
| `commands::search` | Application | `commands/search.rs` | Thin IPC handler: search, suggest |
| `commands::settings` | Application | `commands/settings.rs` | Thin IPC handler: get_all, set, get |
| `services::clipboard_service` | Application | `services/clipboard_service.rs` | CRUD orchestration, pruning logic |
| `services::search_service` | Application | `services/search_service.rs` | FTS5 query + fuzzy re-rank |
| `services::settings_service` | Application | `services/settings_service.rs` | Default merging, validation |
| `domain::clip` | Domain | `domain/clip.rs` | `Clip`, `NewClip`, `ClipUpdate` structs |
| `domain::traits` | Domain | `domain/traits.rs` | Repository trait definitions |
| `domain::pipeline` | Domain | `domain/pipeline.rs` | `PipelineStage` trait + `StageAction` |
| `domain::category` | Domain | `domain/category.rs` | `ContentCategory` enum + detection fns |
| `infrastructure::database` | Infrastructure | `infrastructure/database/` | SQLite repos, connection, migrations |
| `infrastructure::clipboard` | Infrastructure | `infrastructure/clipboard/` | Monitor + native/Wayland adapters |
| `infrastructure::pipeline` | Infrastructure | `infrastructure/pipeline/` | 7-stage runner + stage implementations |

---

## 3. IPC Patterns

### Command → Response Flow

```mermaid
sequenceDiagram
    participant FE as React Frontend
    participant IPC as Tauri IPC Bridge
    participant CMD as commands/
    participant SVC as services/
    participant REPO as infrastructure/ (repo)
    participant DB as SQLite

    FE->>IPC: invoke("list_clips", { offset, limit })
    IPC->>CMD: list_clips(state, args)
    CMD->>SVC: clipboard_service.list(offset, limit)
    SVC->>REPO: clip_repo.list(offset, limit)
    REPO->>DB: SELECT ... ORDER BY created_at DESC
    DB-->>REPO: rows
    REPO-->>SVC: Vec<Clip>
    SVC-->>CMD: Vec<Clip>
    CMD-->>IPC: JSON serialize
    IPC-->>FE: Promise<Clip[]>
```

### Event Emission Pattern

| Event | Emitter | Payload | Consumer |
|-------|---------|---------|----------|
| `clip-created` | Notifier pipeline stage | `{ id: i64 }` | `useClipboardItems` → `invalidateQueries` |
| `clip-deleted` | `ClipboardService` | `{ id: i64 }` | `useClipboardItems` → `invalidateQueries` |
| `clip-updated` | `ClipboardService` | `{ id: i64 }` | `useClipboardItems` → `invalidateQueries` |
| `settings-changed` | `SettingsService` | `{ key: String }` | Settings hooks → `invalidateQueries` |

---

## 4. Data Flow — Clipboard Capture

```mermaid
flowchart TD
    A["OS Clipboard Change"] --> B["ClipboardMonitor detects"]
    B --> C["Pipeline Stage 1: Normalizer<br/>trim, CRLF→LF, NFC, strip nulls"]
    C --> D["Stage 2: Hasher<br/>xxHash64 → hex string"]
    D --> E["Stage 3: Dedup<br/>LRU(500) check → DB check"]
    E -->|Duplicate| F["Bump existing updated_at<br/>StageAction::Skip"]
    E -->|Unique| G["Stage 4: Categorizer<br/>16+ regex patterns, first match"]
    G --> H["Stage 5: Metadata<br/>preview, char_count, line_count, source_app"]
    H --> I["Stage 6: Persister<br/>INSERT into clips table<br/>FTS5 sync via trigger"]
    I --> J["Stage 7: Notifier<br/>emit('clip-created', {id})"]
    J --> K["Frontend: TanStack Query invalidates<br/>→ refetches → UI re-renders"]
```

---

## 5. Data Flow — Search

```mermaid
flowchart TD
    A["User types in SearchBar"] --> B["150ms debounce"]
    B --> C["invoke('search', {query})"]
    C --> D["SearchService.search(query)"]
    D --> E["FTS5: SELECT rowid FROM clips_fts<br/>WHERE clips_fts MATCH 'query*'<br/>LIMIT 200"]
    E --> F["Rust fuzzy re-rank top 200"]
    F --> G["Return top 50 results"]
    G --> H["TanStack Query caches result"]
    H --> I["VirtualList renders ~20 visible items"]
```

---

## 6. Data Flow — User Actions

```mermaid
flowchart TD
    A["User Action (delete / favorite / pin)"] --> B["invoke('action_cmd', {id, ...})"]
    B --> C["Command validates input"]
    C --> D["Service executes business logic"]
    D --> E["Repository writes to SQLite"]
    E --> F["Service emits Tauri event (clip-updated / clip-deleted)"]
    F --> G["Frontend useTauriEvent hook"]
    G --> H["queryClient.invalidateQueries()"]
    H --> I["TanStack Query refetches"]
    I --> J["UI re-renders"]
```

---

## 7. AppState — Dependency Injection

```rust
/// Defined in state.rs — constructed once during startup.
/// Passed to all Tauri commands via Tauri's managed state.
pub struct AppState {
    pub clipboard_service: ClipboardService,
    pub search_service: SearchService,
    pub settings_service: SettingsService,
    pub config: AppConfig,
    pub app_handle: AppHandle,
}
```

### Construction Sequence

```mermaid
flowchart TD
    A["main.rs: tauri::Builder"] --> B["Open SQLite + apply PRAGMAs"]
    B --> C["Run migrations"]
    C --> D["Build repositories (SqliteClipRepo, etc.)"]
    D --> E["Build services (inject repos via constructor)"]
    E --> F["Load AppConfig (defaults + settings table merge)"]
    F --> G["Construct AppState"]
    G --> H[".manage(AppState)"]
    H --> I["Register commands: list_clips, search, etc."]
    I --> J["Start clipboard monitor (background task)"]
    J --> K["App ready"]
```

### Why No DI Container

Rust constructors are explicit and type-safe. A DI framework adds indirection without benefit for this project size. Each service takes its dependencies as constructor parameters — simple, testable, debuggable. See ARCHITECTURE_FINAL.md §18.
