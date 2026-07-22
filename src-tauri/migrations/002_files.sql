-- ORNAS V1.0 - File Clipboard Support
-- Adds `clip_files` table to avoid dumping large binaries or duplicating file metadata.

CREATE TABLE clip_files (
    id              INTEGER PRIMARY KEY,
    clip_id         INTEGER NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,
    file_name       TEXT NOT NULL,
    extension       TEXT,
    mime_type       TEXT,
    file_size       INTEGER NOT NULL DEFAULT 0,
    is_dir          INTEGER NOT NULL DEFAULT 0,
    is_readonly     INTEGER NOT NULL DEFAULT 0,
    created_time    INTEGER,
    modified_time   INTEGER,
    
    hash            TEXT,
    thumbnail_path  TEXT,
    status          TEXT NOT NULL DEFAULT 'Available',
    selection_group INTEGER NOT NULL DEFAULT 0,
    icon_type       TEXT NOT NULL DEFAULT 'file',
    
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_clip_files_clip_id ON clip_files(clip_id);
CREATE INDEX idx_clip_files_status ON clip_files(status);

-- Update FTS triggers to include file names
-- We store the file names space-separated in content_text for file clips.
