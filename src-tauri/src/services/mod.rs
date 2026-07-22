//! Application services — business logic orchestration.
//!
//! Services coordinate domain logic and repository operations.
//! They are the primary consumers of repository traits.

pub mod clipboard_service;
pub mod collection_service;
pub mod crypto_service;
pub mod search_service;
pub mod settings_service;
pub mod tag_service;
pub mod backup_manager;
pub mod file_clipboard;
