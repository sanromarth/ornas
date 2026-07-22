-- Add code snippet metadata to clips table
ALTER TABLE clips ADD COLUMN language TEXT;
ALTER TABLE clips ADD COLUMN is_code INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clips ADD COLUMN detection_confidence REAL NOT NULL DEFAULT 0.0;
ALTER TABLE clips ADD COLUMN language_source TEXT NOT NULL DEFAULT 'auto' CHECK(language_source IN ('auto', 'manual'));
