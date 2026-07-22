# ORNAS — Never Lose a Copy

> The open-source clipboard productivity workspace.

[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-2024-orange?logo=rust)](https://www.rust-lang.org)
[![SQLite](https://img.shields.io/badge/SQLite-FTS5-003B57?logo=sqlite)](https://www.sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

ORNAS is a lightweight, offline-first desktop application that captures, organizes, and searches everything you copy. Built with Tauri v2 for native performance with a modern web UI.

## Features (V1.0)

- 📋 **Automatic clipboard capture** — text, images, rich text
- 🔍 **Instant full-text search** — FTS5 powered, sub-50ms on 10k items
- ⭐ **Favorites & pins** — keep important clips always accessible
- 🏷️ **Smart categorization** — auto-detect URLs, code, emails, JSON, and more
- ⌨️ **Keyboard-first UX** — every action reachable without a mouse
- 🖼️ **Image support** — capture and preview clipboard images
- 🔒 **Offline-only** — zero network calls, zero telemetry, zero cloud
- 🧹 **Auto-pruning** — configurable retention with smart cleanup
- 🎨 **Dark & light themes** — follows system preference
- ⚡ **Fast startup** — under 2 seconds cold, under 500ms warm
- 📦 **Tiny footprint** — under 15MB binary, under 150MB memory

## Quick Start

```bash
git clone https://github.com/sanromarth/ornas.git
cd ornas
npm install
npm run tauri dev
```

### Prerequisites

- [Rust](https://rustup.rs) (1.77+)
- [Node.js](https://nodejs.org) (20+)
- Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`

See [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) for full setup instructions.

## Architecture

ORNAS follows clean architecture principles with a Rust backend and React frontend.

See [docs/ARCHITECTURE_FINAL.md](docs/ARCHITECTURE_FINAL.md) for the complete specification.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.
