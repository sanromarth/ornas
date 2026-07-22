import sqlite3
import time
import random
import os

db_path = "/home/sanro/.local/share/ornas/ornas.db"
# Ensure the directory exists
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Start transaction
c.execute("BEGIN TRANSACTION")

# Insert 100,000 rows
base_time = int(time.time()) - 1000000

for i in range(100_000):
    text = f"Sample clip content number {i} for stress testing"
    created_at = base_time + (i * 10)
    
    c.execute("""
        INSERT INTO clips (
            content_text, content_type, category, content_hash, char_count, line_count, 
            is_favorite, is_pinned, created_at, updated_at,
            language_source, detection_confidence, is_code, is_encrypted
        ) VALUES (
            ?, 'text', 'plain_text', ?, 50, 1, 0, 0, ?, ?,
            'auto', 0.0, 0, 0
        )
    """, (text, f"hash_{i}", created_at, created_at))
    
    row_id = c.lastrowid
    # FTS handles insert automatically via triggers, so we don't insert to fts manually.

c.execute("COMMIT")
print("Inserted 100,000 rows.")
conn.close()
