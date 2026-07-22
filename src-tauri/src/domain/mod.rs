//! Domain layer — pure business rules with zero I/O dependencies.
//!
//! This module defines the core entities, traits, and business logic
//! for ORNAS. Nothing in this module depends on external crates,
//! databases, or frameworks. It depends only on the Rust standard library.

pub mod category;
pub mod clip;
pub mod collection;
pub mod config;
pub mod pipeline;
pub mod tag;
pub mod traits;
pub mod vault;
