//! Clipboard monitor — dispatches to platform-specific implementation.
//!
//! The monitor runs on a dedicated OS thread and sends clipboard changes
//! to the processing pipeline via an mpsc channel.

/// Trait for clipboard monitoring implementations.
pub trait ClipboardMonitor: Send {
    /// Start monitoring the system clipboard for changes.
    fn start(&mut self);
    /// Stop monitoring gracefully.
    fn stop(&mut self);
}
