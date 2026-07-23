# Development Setup

## Prerequisites

### All Platforms
- [Rust](https://rustup.rs) 1.85+ (via rustup)
- [Node.js](https://nodejs.org) 20+ LTS
- npm 10+

### Linux (Debian/Ubuntu)
```bash
sudo apt install build-essential libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev libxdo-dev
```

### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.1-devel gtk3-devel \
  libappindicator-gtk3-devel librsvg2-devel libxdo-devel
```

### macOS
```bash
xcode-select --install
```

### Windows
- Install [Visual Studio Build Tools 2019+](https://visualstudio.microsoft.com/downloads/)
- WebView2 Runtime (included in Windows 11, install separately on Windows 10)

## Getting Started

```bash
git clone https://github.com/sanromarth/ornas.git
cd ornas
npm install
npm run tauri dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Start development (Vite + Tauri) |
| `npm run tauri build` | Build production binary |
| `npm run dev` | Frontend only (Vite dev server) |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `cargo test` | Run Rust tests (from `src-tauri/`) |
| `cargo clippy` | Run Rust linter (from `src-tauri/`) |
