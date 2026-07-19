//! Central configuration — every configurable value in one place.
//!
//! `AppConfig` holds all application defaults. No magic numbers exist
//! anywhere else in the codebase. Values are loaded from the settings
//! table on startup, falling back to compiled-in defaults.

/// Central application configuration with typed defaults.
///
/// See ARCHITECTURE_FINAL.md §10 for the full specification.
#[derive(Debug, Clone)]
pub struct AppConfig {
    // ── Clipboard ──────────────────────────────────
    /// Polling interval for Wayland fallback monitor (ms).
    pub clipboard_poll_interval_ms: u64,
    /// Debounce window for rapid clipboard changes (ms).
    pub clipboard_debounce_ms: u64,
    /// Apps excluded from clipboard recording.
    pub excluded_apps: Vec<String>,

    // ── Database ───────────────────────────────────
    /// SQLite page cache size in KB.
    pub db_cache_size_kb: u32,
    /// Maximum number of clips to retain.
    pub history_max_size: u32,
    /// Days to retain non-favorite, non-pinned clips.
    pub retention_days: u32,
    /// Pruning check interval (seconds).
    pub prune_interval_secs: u64,

    // ── Search ─────────────────────────────────────
    /// Max results from FTS5 candidate query.
    pub search_candidate_limit: u32,
    /// Max results returned to frontend.
    pub search_result_limit: u32,
    /// Frontend search debounce (ms).
    pub search_debounce_ms: u64,

    // ── UI ─────────────────────────────────────────
    /// Characters in clip preview.
    pub preview_length: usize,
    /// Entries in dedup LRU cache.
    pub dedup_cache_size: usize,
    /// Maximum image file size to capture (bytes).
    pub max_image_size_bytes: u64,

    // ── Shortcuts ──────────────────────────────────
    /// Global hotkey to toggle search window.
    pub global_shortcut: String,

    // ── Theme ──────────────────────────────────────
    /// Initial theme: "dark", "light", or "system".
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            clipboard_poll_interval_ms: 500,
            clipboard_debounce_ms: 100,
            excluded_apps: Vec::new(),
            db_cache_size_kb: 16_000,
            history_max_size: 10_000,
            retention_days: 90,
            prune_interval_secs: 3600,
            search_candidate_limit: 200,
            search_result_limit: 50,
            search_debounce_ms: 150,
            preview_length: 200,
            dedup_cache_size: 500,
            max_image_size_bytes: 10_485_760,
            global_shortcut: "CmdOrCtrl+Shift+V".into(),
            theme: "system".into(),
        }
    }
}
