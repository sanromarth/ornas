//! Clipboard processing pipeline — stage implementations and runner.
//!
//! See ARCHITECTURE_FINAL.md §7 for the pipeline specification.

pub mod categorizer;
pub mod dedup;
pub mod hasher;
pub mod metadata;
pub mod normalizer;
pub mod notifier;
pub mod persister;
pub mod runner;
