//! Clipboard processing pipeline — stage implementations and runner.
//!
//! See ARCHITECTURE_FINAL.md §7 for the pipeline specification.

pub mod categorizer;
pub mod content_classifier;
pub mod dedup;
pub mod dispatcher;
pub mod hasher;
pub mod job_queue;
pub mod language_classifier;
pub mod metadata;
pub mod normalizer;

pub mod persister;
pub mod runner;
