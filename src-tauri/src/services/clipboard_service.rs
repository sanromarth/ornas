//! Clipboard service — orchestrates clipboard CRUD operations.
//!
//! Coordinates between the ClipRepository and domain logic.
//! Handles pruning, favorites, pins, and deletion.

/// Clipboard service that coordinates clip operations.
///
/// Receives repository implementations via constructor injection.
/// Will be constructed in `AppState::new()` during Milestone 1.
pub struct ClipboardService;

impl ClipboardService {
    /// Creates a new clipboard service.
    pub fn new() -> Self {
        Self
    }
}
