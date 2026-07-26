//! Clipboard processing pipeline — stage implementations and runner.
//!
//! See ARCHITECTURE_FINAL.md §7 for the pipeline specification.

pub mod categorizer;
pub mod code_detector;
pub mod dedup;
pub mod dispatcher;
pub mod hasher;
pub mod job_queue;
pub mod metadata;
pub mod normalizer;

pub mod persister;
pub mod runner;

