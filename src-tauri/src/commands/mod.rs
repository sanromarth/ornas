//! Tauri command handlers — thin IPC entry points.
//!
//! Each command validates input, delegates to services, and returns results.
//! Commands should remain under ~20 lines each. Business logic belongs in services.

pub mod backup;
pub mod clipboard;
pub mod collections;
pub mod search;
pub mod settings;
pub mod tags;
pub mod vault;
