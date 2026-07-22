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

impl AppConfig {
    /// Merges settings from a key-value list over the compiled defaults.
    ///
    /// Unknown keys are silently ignored. Invalid values fall back to defaults.
    pub fn load_from_settings(settings: &[(String, String)]) -> Self {
        let mut config = Self::default();
        for (key, value) in settings {
            match key.as_str() {
                "clipboard_poll_interval_ms" => {
                    if let Ok(v) = value.parse() {
                        config.clipboard_poll_interval_ms = v;
                    }
                }
                "clipboard_debounce_ms" => {
                    if let Ok(v) = value.parse() {
                        config.clipboard_debounce_ms = v;
                    }
                }
                "excluded_apps" => {
                    config.excluded_apps = value
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect();
                }
                "db_cache_size_kb" => {
                    if let Ok(v) = value.parse() {
                        config.db_cache_size_kb = v;
                    }
                }
                "history_max_size" => {
                    if let Ok(v) = value.parse() {
                        config.history_max_size = v;
                    }
                }
                "retention_days" => {
                    if let Ok(v) = value.parse() {
                        config.retention_days = v;
                    }
                }
                "prune_interval_secs" => {
                    if let Ok(v) = value.parse() {
                        config.prune_interval_secs = v;
                    }
                }
                "search_candidate_limit" => {
                    if let Ok(v) = value.parse() {
                        config.search_candidate_limit = v;
                    }
                }
                "search_result_limit" => {
                    if let Ok(v) = value.parse() {
                        config.search_result_limit = v;
                    }
                }
                "search_debounce_ms" => {
                    if let Ok(v) = value.parse() {
                        config.search_debounce_ms = v;
                    }
                }
                "preview_length" => {
                    if let Ok(v) = value.parse() {
                        config.preview_length = v;
                    }
                }
                "dedup_cache_size" => {
                    if let Ok(v) = value.parse() {
                        config.dedup_cache_size = v;
                    }
                }
                "max_image_size_bytes" => {
                    if let Ok(v) = value.parse() {
                        config.max_image_size_bytes = v;
                    }
                }
                "global_shortcut" => {
                    config.global_shortcut = value.clone();
                }
                "theme" => {
                    config.theme = value.clone();
                }
                _ => {} // Unknown keys silently ignored
            }
        }
        config
    }

    /// Returns the retention period in seconds.
    pub fn retention_secs(&self) -> i64 {
        self.retention_days as i64 * 86400
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.retention_days, 90);
        assert_eq!(config.dedup_cache_size, 500);
        assert_eq!(config.preview_length, 200);
        assert_eq!(config.theme, "system");
    }

    #[test]
    fn test_load_from_settings() {
        let settings = vec![
            ("retention_days".into(), "30".into()),
            ("theme".into(), "dark".into()),
            ("excluded_apps".into(), "1Password, Bitwarden".into()),
            ("invalid_key".into(), "ignored".into()),
        ];
        let config = AppConfig::load_from_settings(&settings);
        assert_eq!(config.retention_days, 30);
        assert_eq!(config.theme, "dark");
        assert_eq!(config.excluded_apps, vec!["1Password", "Bitwarden"]);
        // Unchanged defaults
        assert_eq!(config.dedup_cache_size, 500);
    }

    #[test]
    fn test_invalid_value_keeps_default() {
        let settings = vec![("retention_days".into(), "not_a_number".into())];
        let config = AppConfig::load_from_settings(&settings);
        assert_eq!(config.retention_days, 90); // default preserved
    }

    #[test]
    fn test_retention_secs() {
        let config = AppConfig::default();
        assert_eq!(config.retention_secs(), 90 * 86400);
    }
}
