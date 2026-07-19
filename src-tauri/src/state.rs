//! Application state — holds all services and configuration.
//!
//! `AppState` is constructed once at startup and passed to Tauri
//! via `.manage()`. All command handlers receive it via dependency injection.
//! Services access repository implementations through trait objects.

use crate::domain::config::AppConfig;

/// Shared application state managed by Tauri.
///
/// All fields are thread-safe (`Send + Sync`) because Tauri
/// commands may execute on any thread.
pub struct AppState {
    /// Central application configuration.
    pub config: AppConfig,
    // Repository implementations and services will be added
    // when database initialization is implemented in Milestone 1.
}

impl AppState {
    /// Creates a new `AppState` with default configuration.
    ///
    /// In the full implementation, this will:
    /// 1. Open the SQLite database
    /// 2. Run migrations
    /// 3. Load user settings to override defaults
    /// 4. Construct repository implementations
    /// 5. Construct service instances
    pub fn new() -> Self {
        Self {
            config: AppConfig::default(),
        }
    }
}
