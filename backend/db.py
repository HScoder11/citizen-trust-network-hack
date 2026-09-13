import sqlite3
from pathlib import Path

# SQLite database file path (relative to backend root)
DB_PATH = Path(__file__).parent / "complaints.db"

def get_db():
    """Open a new database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables column access by name
    return conn

def init_db():
    """Create the complaints table if it doesn't exist."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            payload TEXT,
            before_path TEXT,
            voice_path TEXT,
            created_at TEXT,
            lat REAL,
            lng REAL
        )
    """)
    conn.commit()
    conn.close()