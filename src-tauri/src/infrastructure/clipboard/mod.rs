//! Clipboard monitoring infrastructure — native and fallback implementations.

pub mod classifier;
pub mod monitor;
pub mod native;
#[cfg(target_os = "linux")]
pub mod wayland;
