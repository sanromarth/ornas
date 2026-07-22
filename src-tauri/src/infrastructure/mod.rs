//! Infrastructure layer — external system implementations.
//!
//! This layer implements the domain traits using real I/O:
//! SQLite for persistence, clipboard-rs for monitoring,
//! filesystem for image storage, etc.

pub mod clipboard;
pub mod database;
pub mod image_store;
pub mod pipeline;
