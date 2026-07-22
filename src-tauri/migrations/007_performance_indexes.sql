-- Milestone 15: Performance Indexes
-- Adds a compound index to support efficient cursor-based pagination and sorting.

CREATE INDEX IF NOT EXISTS idx_clips_cursor ON clips(is_pinned DESC, created_at DESC, id DESC);
