# Build Guide

## Development Build

```bash
npm run tauri dev
```

## Production Build

```bash
npm run tauri build
```

### Output Locations

| Platform | Format | Path |
|----------|--------|------|
| Linux | AppImage, .deb | `src-tauri/target/release/bundle/` |
| macOS | .app, .dmg | `src-tauri/target/release/bundle/` |
| Windows | .msi, .exe | `src-tauri/target/release/bundle/` |

## Build Dependencies

See [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) for platform-specific requirements.

## Release Optimizations

The release profile in `Cargo.toml` enables:
- LTO (Link-Time Optimization)
- Single codegen unit
- Symbol stripping
- Abort on panic
