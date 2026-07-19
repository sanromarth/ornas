# Changelog

All notable changes to ORNAS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project foundation: Tauri v2 + React 19 + TypeScript 5 + Rust 2024 edition
- Clean architecture: commands → services → domain → infrastructure
- SQLite schema with FTS5 full-text search (migration 001)
- 7-stage clipboard processing pipeline (trait-based)
- Central configuration system (`AppConfig` with typed defaults)
- TailwindCSS v4 with dark/light theme tokens
- Zustand stores for UI and navigation state
- TanStack Query integration with query key factory
- Feature-based frontend architecture (clipboard, search, settings, command-palette)
- Full tooling: ESLint v9, Prettier, rustfmt, Clippy, EditorConfig
- Architecture documentation (ARCHITECTURE_FINAL.md)
