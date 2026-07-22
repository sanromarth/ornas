# ORNAS — Coding Standards

> Canonical reference: [ARCHITECTURE_FINAL.md](../ARCHITECTURE_FINAL.md)

---

## 1. Overview

These standards enforce consistency, readability, and maintainability across the ORNAS
codebase. Every contributor follows these rules. Linting and formatting are automated
where possible; code review catches the rest.

---

## 2. Rust Standards

### 2.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Functions | `snake_case` | `fn get_clip_by_id()` |
| Methods | `snake_case` | `fn process_stage()` |
| Types (struct, enum, trait) | `PascalCase` | `struct ClipItem`, `enum ContentCategory` |
| Enum variants | `PascalCase` | `ContentCategory::PlainText` |
| Constants | `SCREAMING_SNAKE_CASE` | `const MAX_PREVIEW_LENGTH: usize = 200;` |
| Modules | `snake_case` | `mod clipboard_service;` |
| Type parameters | Single uppercase or `PascalCase` | `<T>`, `<Repo>` |
| Crate names | `kebab-case` | `clipboard-rs` |
| Trait implementations | Named after what they implement | `SqliteClipRepo` |

### 2.2 Error Handling

| Rule | Details |
|------|---------|
| **Central error type** | All errors flow through `AppError` (defined in `error.rs` using `thiserror`) |
| **No `.unwrap()`** | Forbidden outside tests. Use `?` operator or explicit match |
| **No `.expect()` in production** | Allowed only with a `// SAFETY:` comment explaining the invariant |
| **Result return** | All fallible functions return `Result<T, AppError>` |
| **Error context** | Use `thiserror` `#[from]` for automatic conversion; add context in messages |
| **Logging on error** | Commands log at `tracing::error!`; services log at `tracing::warn!` |

```rust
// ✅ Correct — Central error type with thiserror
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Clipboard error: {0}")]
    Clipboard(String),

    #[error("Pipeline error at stage '{stage}': {message}")]
    Pipeline { stage: &'static str, message: String },

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Not found: {0}")]
    NotFound(String),
}

// ❌ Wrong — Never do this
let value = some_option.unwrap();            // panics in production
let conn = db.connect().expect("db failed"); // panics in production
```

### 2.3 Module Size

| Constraint | Limit | Enforcement |
|-----------|:-----:|-------------|
| Lines per file | **< 300** | Code review; CI lint (planned) |
| Functions per file | < 10 | Guideline |
| Imports per file | < 15 | Guideline — too many imports = too many responsibilities |

**When a file exceeds 300 lines:**

1. Identify the secondary responsibility
2. Extract into a new file in the same module
3. Re-export from `mod.rs` if the extracted item is public

### 2.4 Documentation

| Element | Requirement |
|---------|-------------|
| `pub` functions | `///` doc comment required — describe purpose, params, errors |
| `pub` structs | `///` doc comment required — describe purpose and invariants |
| `pub` enums | `///` on enum + each variant |
| `pub` trait methods | `///` required — describe contract and expected behavior |
| Private functions | No doc comment required; inline `//` comments for non-obvious logic |
| Module-level (`//!`) | Required for each module's `mod.rs` — one-sentence purpose |

```rust
/// Computes an xxHash64 digest of the normalized content.
///
/// Used for duplicate detection in the clipboard pipeline.
/// Returns the hash as a lowercase hexadecimal string.
pub fn compute_hash(content: &str) -> String {
    let hash = xxhash_rust::xxh64::xxh64(content.as_bytes(), 0);
    format!("{:016x}", hash)
}
```

### 2.5 Formatting & Linting

| Tool | Config | Runs On |
|------|--------|---------|
| `rustfmt` | Default (edition 2024) | Pre-commit + CI |
| `clippy` | `#![warn(clippy::all, clippy::pedantic)]` | CI (deny on warnings) |

**Suppressed Clippy lints** (with justification):

```rust
// lib.rs — project-level lint config
#![allow(clippy::module_name_repetitions)]  // ClipboardService in clipboard_service.rs is fine
#![allow(clippy::cast_possible_truncation)] // u64 → i64 for SQLite; values never exceed i64::MAX
```

### 2.6 Rust Idioms

| Idiom | Rule |
|-------|------|
| Ownership | Prefer borrowing (`&T`) over cloning. Clone only when the caller needs ownership |
| Iterators | Prefer `.iter().map().collect()` over `for` loops with `push()` |
| Pattern matching | Use `match` over `if let` chains when 3+ variants exist |
| Builder pattern | Only for types with 4+ optional fields (not for simple structs) |
| `Arc<Mutex<T>>` | Use `tokio::sync::RwLock` for read-heavy data; `Mutex` only for write-heavy |
| `String` vs `&str` | Accept `&str` in function params; return `String` from functions |
| Feature flags | Use `cfg` attributes for platform-specific code (Wayland fallback) |

---

## 3. TypeScript / React Standards

### 3.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | `PascalCase` | `ClipboardList.tsx` |
| Hooks | `camelCase` with `use` prefix | `useClipboardItems.ts` |
| Utility functions | `camelCase` | `formatRelativeTime()` |
| Constants | `SCREAMING_SNAKE_CASE` | `SEARCH_DEBOUNCE_MS` |
| Types / Interfaces | `PascalCase` | `interface ClipItem` |
| Enum-like objects | `PascalCase` keys | `ContentCategory.PlainText` |
| Files — components | `PascalCase.tsx` | `ClipboardItem.tsx` |
| Files — hooks | `camelCase.ts` | `useSearch.ts` |
| Files — utils | `camelCase.ts` | `formatters.ts` |

### 3.2 Export Rules

| Rule | Details |
|------|---------|
| **Named exports only** | No `export default` — named exports enable refactoring tools and tree-shaking |
| **Barrel exports** | Each feature has `index.ts` that re-exports its public API |
| **No cross-feature imports** | Features import from other features' `index.ts`, never internal files |

```typescript
// ✅ Correct
export function ClipboardList() { ... }
export { ClipboardList } from './components/ClipboardList';

// ❌ Wrong
export default function ClipboardList() { ... }
import { ClipboardItem } from '../clipboard/components/ClipboardItem'; // internal!
```

### 3.3 Component Guidelines

| Constraint | Limit | Enforcement |
|-----------|:-----:|-------------|
| Lines per component | **< 150** | Code review |
| Props per component | < 8 | Guideline — too many props = split component |
| Hooks per component | < 6 | Guideline — extract into custom hook |

**When a component exceeds 150 lines:**

1. Extract business logic into a custom hook (`use[Feature].ts`)
2. Extract sub-elements into child components
3. The parent component should read like a template

### 3.4 Hook Rules

| Rule | Details |
|------|---------|
| Prefix | Always `use` (enforced by React linter) |
| One responsibility | Each hook does one thing |
| Return type | Typed object, not tuple (for readability at call site) |
| TanStack Query wrappers | One file per entity: `useClipboardItems.ts` wraps `useQuery` |
| Side effects | Only in `useEffect` or TanStack Query `onSuccess`/`onError` |

```typescript
// ✅ Correct — named return object
export function useClipboardItems(filter: ClipFilter) {
  const query = useQuery({ ... });
  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### 3.5 TypeScript Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| `strict` | `true` | Full type safety |
| `noUnusedLocals` | `true` | Clean code |
| `noUnusedParameters` | `true` | Clean code |
| `noImplicitReturns` | `true` | Prevent missing return branches |
| `exactOptionalPropertyTypes` | `true` | Distinguish `undefined` from missing |

### 3.6 Formatting & Linting

| Tool | Runs On |
|------|---------|
| ESLint (flat config) | Pre-commit + CI |
| Prettier (default config) | Pre-commit + CI |

---

## 4. Conventional Commits

All commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

### 4.1 Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 4.2 Types

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | `feat(search): add FTS5 prefix query support` |
| `fix` | Bug fix | `fix(pipeline): handle null bytes in clipboard content` |
| `refactor` | Code restructuring (no behavior change) | `refactor(domain): extract category detection to module` |
| `perf` | Performance improvement | `perf(search): add candidate limit before fuzzy re-rank` |
| `docs` | Documentation | `docs(architecture): add security model document` |
| `test` | Test additions or fixes | `test(dedup): add unit tests for LRU cache eviction` |
| `chore` | Build, CI, tooling | `chore(ci): add cargo audit to PR pipeline` |
| `style` | Formatting (no logic change) | `style(rust): apply rustfmt to pipeline module` |

### 4.3 Scopes

| Scope | Covers |
|-------|--------|
| `domain` | `src-tauri/src/domain/` |
| `pipeline` | `src-tauri/src/infrastructure/pipeline/` |
| `database` | `src-tauri/src/infrastructure/database/` |
| `clipboard` | `src-tauri/src/infrastructure/clipboard/` |
| `commands` | `src-tauri/src/commands/` |
| `services` | `src-tauri/src/services/` |
| `search` | Search feature (both Rust + React) |
| `ui` | React shared components |
| `settings` | Settings feature |
| `ci` | CI/CD configuration |
| `deps` | Dependency updates |

### 4.4 Rules

| Rule | Enforcement |
|------|-------------|
| Subject line ≤ 72 characters | CI commit lint |
| Imperative mood ("add", not "added") | Code review |
| No period at end of subject | CI commit lint |
| Breaking changes use `!` suffix | `feat(api)!: rename search command` |
| Reference issue numbers in footer | `Closes #42` |

---

## 5. Code Review Checklist

Every PR is reviewed against these 5 items before merge:

| # | Check | What to Look For |
|---|-------|-----------------|
| 1 | **Architecture compliance** | Dependencies point inward. Domain has no I/O imports. Commands don't import infrastructure. Features don't cross-import internals. |
| 2 | **Error handling** | No `.unwrap()` outside tests. All errors return `AppError`. Error messages are descriptive. Errors are logged at appropriate level. |
| 3 | **Performance impact** | No unbounded queries. No synchronous DB on main thread. New allocations justified. No regression in pipeline latency. |
| 4 | **Security** | No `innerHTML` or `eval()`. No new network-capable deps. Capability files unchanged or justified. Content escaped before render. |
| 5 | **Size & readability** | Rust files < 300 lines. React components < 150 lines. Functions do one thing. Names are self-documenting. `pub` items have doc comments. |

---

## 6. File Organization Rules

| Rule | Enforcement |
|------|-------------|
| `domain/` has zero external crate imports | Code review — if `rusqlite` appears in domain, it is a bug |
| `commands/` never imports `infrastructure/` | Module visibility — commands use traits from `domain/traits.rs` |
| Feature modules never import other features' internals | Only import from `feature/index.ts` barrel exports |
| `shared/` never imports from `features/` | Shared components are feature-agnostic |
| One component per file | No multiple component exports from a single `.tsx` |
| Tests live next to source (Rust: `#[cfg(test)] mod tests`) | In-file for unit tests; `tests/` directory for integration |

---

## 7. Git Workflow

| Aspect | Rule |
|--------|------|
| Branch naming | `type/short-description` (e.g., `feat/fts5-search`, `fix/pipeline-null-bytes`) |
| Merge strategy | Squash merge to `main` |
| PR size | < 400 lines changed (split larger changes) |
| PR description | Template: What, Why, How, Testing |
| Required checks | `cargo test` + `cargo clippy` + `npm run lint` + `npm run typecheck` |
