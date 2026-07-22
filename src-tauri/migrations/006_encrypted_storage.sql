-- Milestone 14: Encrypted Storage
-- Adds encryption fields to the clips table and creates a vault configuration table.

-- We can't ALTER TABLE to add NOT NULL columns without default values in SQLite easily,
-- but we can add with DEFAULT.

ALTER TABLE clips ADD COLUMN is_encrypted BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE clips ADD COLUMN encryption_version INTEGER DEFAULT NULL;
ALTER TABLE clips ADD COLUMN encrypted_blob BLOB DEFAULT NULL;
ALTER TABLE clips ADD COLUMN nonce BLOB DEFAULT NULL;

-- Create vault_config table to store the Argon2 salt and verification payload
CREATE TABLE IF NOT EXISTS vault_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
    salt BLOB NOT NULL,
    verification_nonce BLOB NOT NULL,
    verification_payload BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Update FTS triggers to skip indexing encrypted clips
-- First, drop the existing triggers
DROP TRIGGER IF EXISTS clips_ai;
DROP TRIGGER IF EXISTS clips_ad;
DROP TRIGGER IF EXISTS clips_au;

-- Recreate triggers with a condition: only index if is_encrypted = 0
CREATE TRIGGER clips_ai AFTER INSERT ON clips BEGIN
  INSERT INTO clips_fts(rowid, content_text, preview, category, source_app)
  SELECT new.id, new.content_text, new.preview, new.category, new.source_app
  WHERE new.is_encrypted = 0;
END;

CREATE TRIGGER clips_ad AFTER DELETE ON clips BEGIN
  INSERT INTO clips_fts(clips_fts, rowid, content_text, preview, category, source_app)
  VALUES('delete', old.id, old.content_text, old.preview, old.category, old.source_app);
END;

CREATE TRIGGER clips_au AFTER UPDATE ON clips BEGIN
  INSERT INTO clips_fts(clips_fts, rowid, content_text, preview, category, source_app)
  VALUES('delete', old.id, old.content_text, old.preview, old.category, old.source_app);
  
  INSERT INTO clips_fts(rowid, content_text, preview, category, source_app)
  SELECT new.id, new.content_text, new.preview, new.category, new.source_app
  WHERE new.is_encrypted = 0;
END;
