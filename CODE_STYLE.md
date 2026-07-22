# Code Style Guide

## Rust

- **Formatter:** `rustfmt` (config in `src-tauri/rustfmt.toml`)
- **Linter:** `cargo clippy` — zero warnings required
- **Indent:** 4 spaces
- **Max file length:** 300 lines (split if exceeded)
- **Naming:** `snake_case` for functions/variables, `PascalCase` for types
- **Error handling:** Use `AppError` enum — no `.unwrap()` in production code
- **Documentation:** `///` doc comments on all public items

## TypeScript / React

- **Formatter:** Prettier (config in `.prettierrc`)
- **Linter:** ESLint v9 (config in `eslint.config.js`)
- **Indent:** 2 spaces
- **Max component length:** 150 lines
- **Components:** Named function exports (not default exports)
- **Hooks:** Prefix with `use` — one hook per file
- **Naming:** `camelCase` for functions/variables, `PascalCase` for components/types

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(clipboard): add image paste support
fix(search): handle empty query gracefully
docs(readme): update quick start instructions
```
