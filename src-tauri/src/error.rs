//! Unified error types for the ORNAS application.
//!
//! All errors across every layer funnel through `AppError`.
//! This ensures consistent error handling and clean propagation
//! from infrastructure through services to Tauri command responses.

use serde::Serialize;

/// The unified application error type.
///
/// Every fallible function in ORNAS returns `Result<T, AppError>`.
/// Tauri automatically serializes this to JSON for IPC responses.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    #[allow(dead_code)]
    Validation(String),

    #[error("Clipboard error: {0}")]
    Clipboard(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Configuration error: {0}")]
    #[allow(dead_code)]
    Config(String),

    #[error("Pipeline error: {0}")]
    #[allow(dead_code)]
    Pipeline(String),
}

/// Tauri requires errors to implement `Serialize` for IPC transport.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        Self::Database(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        Self::Io(err.to_string())
    }
}

impl From<regex::Error> for AppError {
    fn from(err: regex::Error) -> Self {
        Self::Internal(err.to_string())
    }
}

impl From<zip::result::ZipError> for AppError {
    fn from(err: zip::result::ZipError) -> Self {
        Self::Internal(err.to_string())
    }
}
