-- ORNAS V1.0 Initial Schema
-- See ARCHITECTURE_FINAL.md §9 for the full specification.

-- ═══════════════════════════════════════════════════════
-- CLIPS: Core clipboard history table
-- ═══════════════════════════════════════════════════════
CREATE TABLE clips (
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

CREATE INDEX idx_clips_created   ON clips(created_at DESC);
CREATE INDEX idx_clips_hash      ON clips(content_hash);
CREATE INDEX idx_clips_category  ON clips(category);
CREATE INDEX idx_clips_favorites ON clips(created_at DESC) WHERE is_favorite = 1;
CREATE INDEX idx_clips_pinned    ON clips(created_at DESC) WHERE is_pinned = 1;

-- ═══════════════════════════════════════════════════════
-- FTS5: Full-text search index (external content)
-- ═══════════════════════════════════════════════════════
CREATE VIRTUAL TABLE clips_fts USING fts5(
    content_text,
    preview,
    content='clips',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2',
    prefix='2,3'
);

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

-- ═══════════════════════════════════════════════════════
-- COLLECTIONS + TAGS: Schema ready, UI deferred to V1.1
-- ═══════════════════════════════════════════════════════
CREATE TABLE collections (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    color       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE clip_collections (
    clip_id       INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, collection_id)
);

CREATE TABLE tags (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE,
    color TEXT
);

CREATE TABLE clip_tags (
    clip_id INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (clip_id, tag_id)
);

-- ═══════════════════════════════════════════════════════
-- SETTINGS: Key-value application configuration
-- ═══════════════════════════════════════════════════════
CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
