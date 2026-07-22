-- ORNAS V1.0 - Collections & Tags Indexes
-- Adds indexes to junction tables to prevent full table scans when filtering by collection or tag.

CREATE INDEX IF NOT EXISTS idx_clip_collections_collection_id ON clip_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_clip_tags_tag_id ON clip_tags(tag_id);
