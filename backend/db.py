# backend/db.py

import sqlite3

DB_PATH = "complaints.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            payload TEXT,
            before_path TEXT,
            voice_path TEXT,
            after_path TEXT,
            created_at TEXT,
            lat REAL,
            lng REAL,
            status TEXT DEFAULT 'Reported',
            assigned_to TEXT,
            verification_confidence REAL,
            verification_pass INTEGER,
            certificate_ready INTEGER DEFAULT 0,
            payment_status TEXT DEFAULT 'pending'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ledger (
            block_number INTEGER PRIMARY KEY AUTOINCREMENT,
            prev_hash TEXT,
            payload TEXT,
            timestamp TEXT,
            hash TEXT
        )
    """)
    conn.commit()
    conn.close()
