# Testing Guide

## Running Tests

```bash
# Rust unit + integration tests
cd src-tauri && cargo test

# Rust lint
cd src-tauri && cargo clippy -- -D warnings

# Frontend lint
npm run lint

# Frontend format check
npm run format:check
```

## Test Structure

### Rust Tests
- **Unit tests:** Inline `#[cfg(test)]` modules in each source file
- **Integration tests:** `src-tauri/tests/` directory
- **Focus:** Domain logic (pure functions) and repository implementations

### Frontend Tests
- **Component tests:** Colocated `__tests__/` directories using React Testing Library
- **Focus:** User interactions, not implementation details

## What NOT to Test
- UI snapshot tests (fragile, high maintenance)
- Internal implementation details
- Third-party library behavior
