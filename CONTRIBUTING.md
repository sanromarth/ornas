# Contributing to ORNAS

Thank you for your interest in contributing to ORNAS!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/sanromarth/ornas.git`
3. Install dependencies: `npm install`
4. Start development: `npm run tauri dev`

See [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) for full setup instructions.

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes following the [code style](CODE_STYLE.md)
3. Test your changes: `cargo test && npm test`
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change that neither fixes a bug nor adds a feature
   - `test:` adding or updating tests
   - `chore:` maintenance tasks
5. Push and open a Pull Request

## Architecture

Read [docs/ARCHITECTURE_FINAL.md](docs/ARCHITECTURE_FINAL.md) before making structural changes.

## Code Style

- **Rust:** `cargo fmt` + `cargo clippy` (zero warnings)
- **TypeScript/React:** `npm run lint` + `npm run format`
- See [CODE_STYLE.md](CODE_STYLE.md) for detailed conventions

## Pull Request Guidelines

- One feature per PR
- Include tests for new functionality
- Update documentation if applicable
- All CI checks must pass
