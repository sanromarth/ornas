-- PRAGMA foreign_keys=off;
-- SQLite does not support ALTER TABLE ... DROP CONSTRAINT.
-- The simplest approach to bypassing CHECK constraint validation is to create a new table,
-- but that can be risky and slow.
-- Since this is an alpha/beta version and we updated 001_initial.sql, we'll recreate the table.

PRAGMA foreign_keys=off;

CREATE TABLE clips_new (
    id            INTEGER PRIMARY KEY,
    content_text  TEXT,
    content_html  TEXT,
    content_rtf   TEXT,
    image_path    TEXT,
    content_type  TEXT NOT NULL
                  CHECK(content_type IN ('text', 'image', 'rich_text', 'file')),
    category      TEXT NOT NULL DEFAULT 'plain_text',
    source_app    TEXT,
    content_hash  TEXT NOT NULL,
    preview       TEXT,
    char_count    INTEGER NOT NULL DEFAULT 0,
    line_count    INTEGER NOT NULL DEFAULT 0,
    is_favorite   INTEGER NOT NULL DEFAULT 0,
    is_pinned     INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO clips_new (id, content_text, content_html, content_rtf, image_path, content_type, category, source_app, content_hash, preview, char_count, line_count, is_favorite, is_pinned, created_at, updated_at)
SELECT id, content_text, content_html, content_rtf, image_path, content_type, category, source_app, content_hash, preview, char_count, line_count, is_favorite, is_pinned, created_at, updated_at FROM clips;

DROP TABLE clips;
ALTER TABLE clips_new RENAME TO clips;

CREATE INDEX idx_clips_created   ON clips(created_at DESC);
CREATE INDEX idx_clips_hash      ON clips(content_hash);
CREATE INDEX idx_clips_category  ON clips(category);
CREATE INDEX idx_clips_favorites ON clips(created_at DESC) WHERE is_favorite = 1;
CREATE INDEX idx_clips_pinned    ON clips(created_at DESC) WHERE is_pinned = 1;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS clips_fts_ai;
DROP TRIGGER IF EXISTS clips_fts_ad;
DROP TRIGGER IF EXISTS clips_fts_au;

CREATE TRIGGER clips_fts_ai AFTER INSERT ON clips BEGIN
    INSERT INTO clips_fts(rowid, content_text, preview)
    VALUES (new.id, new.content_text, new.preview);
END;

CREATE TRIGGER clips_fts_ad AFTER DELETE ON clips BEGIN
    INSERT INTO clips_fts(clips_fts, rowid, content_text, preview)
    VALUES ('delete', old.id, old.content_text, old.preview);
END;

CREATE TRIGGER clips_fts_au AFTER UPDATE OF content_text, preview ON clips BEGIN
    INSERT INTO clips_fts(clips_fts, rowid, content_text, preview)
    VALUES ('delete', old.id, old.content_text, old.preview);
    INSERT INTO clips_fts(rowid, content_text, preview)
    VALUES (new.id, new.content_text, new.preview);
END;

PRAGMA foreign_keys=on;
