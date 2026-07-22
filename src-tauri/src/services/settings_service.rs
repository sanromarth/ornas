//! Settings service — business logic for application configuration.
//!
//! Reads and writes settings via the SettingsRepository,
//! and produces an `AppConfig` with user overrides merged over defaults.

use crate::domain::config::AppConfig;
use crate::domain::traits::SettingsRepository;
use crate::error::AppError;
use std::sync::Arc;

/// Service layer for application settings.
///
/// Provides config loading and individual setting get/set operations.
pub struct SettingsService {
    settings_repo: Arc<dyn SettingsRepository>,
}

impl SettingsService {
    /// Creates a new settings service.
    pub fn new(settings_repo: Arc<dyn SettingsRepository>) -> Self {
        Self { settings_repo }
    }

    /// Loads the full application config by merging DB values over defaults.
    pub fn load_config(&self) -> Result<AppConfig, AppError> {
        let all_settings = self.settings_repo.get_all()?;
        Ok(AppConfig::load_from_settings(&all_settings))
    }

    /// Gets a single setting value by key.
    #[allow(dead_code)]
    pub fn get(&self, key: &str) -> Result<Option<String>, AppError> {
        self.settings_repo.get(key)
    }

    /// Sets a single setting value.
    pub fn set(&self, key: &str, value: &str) -> Result<(), AppError> {
        self.settings_repo.set(key, value)
    }

    /// Gets all settings as key-value pairs.
    pub fn get_all(&self) -> Result<Vec<(String, String)>, AppError> {
        self.settings_repo.get_all()
    }

    /// Deletes a setting, reverting it to the compiled default.
    #[allow(dead_code)]
    pub fn delete(&self, key: &str) -> Result<(), AppError> {
        self.settings_repo.delete(key)
    }
}
