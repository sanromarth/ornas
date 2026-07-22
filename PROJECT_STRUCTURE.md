# Project Structure

> See [ARCHITECTURE_FINAL.md](docs/ARCHITECTURE_FINAL.md) §5 for the canonical folder structure.

```
ornas/
├── docs/                           # Architecture documentation
│   ├── ARCHITECTURE_FINAL.md       #   Single source of truth
│   └── architecture/               #   15 detailed design documents
│
├── src-tauri/                      # Rust backend (Tauri v2)
│   ├── Cargo.toml                  #   Rust dependencies
│   ├── tauri.conf.json             #   Tauri configuration
│   ├── capabilities/               #   Permission definitions
│   │   └── default.json            #     Main window capabilities
│   ├── migrations/                 #   SQL migration files
│   │   └── 001_initial.sql         #     V1.0 schema
│   └── src/
│       ├── main.rs                 #   Desktop entry point
│       ├── lib.rs                  #   Library entry (Tauri setup)
│       ├── error.rs                #   Unified AppError type
│       ├── state.rs                #   AppState (DI container)
│       ├── commands/               #   Tauri IPC handlers (thin)
│       │   ├── clipboard.rs
│       │   ├── search.rs
│       │   └── settings.rs
│       ├── services/               #   Business logic orchestration
│       │   ├── clipboard_service.rs
│       │   ├── search_service.rs
│       │   └── settings_service.rs
│       ├── domain/                 #   Pure business rules (no I/O)
│       │   ├── clip.rs             #     Clip entity
│       │   ├── collection.rs       #     Collection entity
│       │   ├── tag.rs              #     Tag entity
│       │   ├── config.rs           #     AppConfig defaults
│       │   ├── category.rs         #     Content categorization
│       │   ├── pipeline.rs         #     PipelineStage trait
│       │   └── traits.rs           #     Repository contracts
│       └── infrastructure/         #   External system implementations
│           ├── database/           #     SQLite via rusqlite
│           │   ├── connection.rs
│           │   ├── migrations.rs
│           │   ├── clip_repo.rs
│           │   ├── search_repo.rs
│           │   └── settings_repo.rs
│           ├── clipboard/          #     System clipboard monitoring
│           │   └── monitor.rs
│           ├── pipeline/           #     7-stage processing pipeline
│           │   ├── runner.rs
│           │   ├── normalizer.rs
│           │   ├── hasher.rs
│           │   ├── dedup.rs
│           │   ├── categorizer.rs
│           │   ├── metadata.rs
│           │   ├── persister.rs
│           │   └── notifier.rs
│           └── image_store.rs      #     Filesystem image storage
│
├── src/                            # React frontend (TypeScript)
│   ├── main.tsx                    #   Entry point
│   ├── app/
│   │   ├── App.tsx                 #   Root component
│   │   └── providers.tsx           #   TanStack Query provider
│   ├── features/                   #   Feature-based modules
│   │   ├── clipboard/              #     Clipboard history
│   │   ├── search/                 #     Full-text search
│   │   ├── command-palette/        #     Cmd+K launcher
│   │   └── settings/               #     App settings
│   ├── shared/                     #   Shared across features
│   │   ├── components/             #     Reusable UI components
│   │   ├── hooks/                  #     Shared React hooks
│   │   ├── layouts/                #     Layout components
│   │   ├── lib/                    #     Utilities, constants
│   │   └── types/                  #     TypeScript type definitions
│   ├── services/                   #   Tauri IPC wrappers
│   ├── stores/                     #   Zustand state stores
│   └── styles/
│       └── globals.css             #   TailwindCSS + theme tokens
│
├── .editorconfig                   # Editor settings
├── .gitignore                      # Git ignore rules
├── .prettierrc                     # Prettier config
├── eslint.config.js                # ESLint v9 flat config
├── index.html                      # Vite entry HTML
├── package.json                    # Node dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite + TailwindCSS config
├── README.md                       # Project overview
├── LICENSE                         # MIT license
├── CONTRIBUTING.md                 # Contribution guide
├── CHANGELOG.md                    # Version history
├── CODE_OF_CONDUCT.md              # Community standards
├── CODE_STYLE.md                   # Coding conventions
├── SECURITY.md                     # Security policy
├── SUPPORT.md                      # Support channels
├── DEVELOPMENT_SETUP.md            # Dev environment setup
├── BUILD_GUIDE.md                  # Build instructions
├── TESTING_GUIDE.md                # Testing guide
├── ARCHITECTURE_INDEX.md           # Documentation index
└── PROJECT_STRUCTURE.md            # This file
```
