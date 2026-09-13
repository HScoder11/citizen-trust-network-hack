# backend/ledger.py

import hashlib
import json
from datetime import datetime
from db import get_db

def create_block(payload: dict) -> str:
    conn = get_db()
    row = conn.execute(
        "SELECT hash FROM ledger ORDER BY block_number DESC LIMIT 1"
    ).fetchone()
    prev_hash = row["hash"] if row else "0" * 64  # genesis block

    payload_str = json.dumps(payload, sort_keys=True)
    timestamp = datetime.utcnow().isoformat()
    new_hash = hashlib.sha256(
        (prev_hash + payload_str + timestamp).encode()
    ).hexdigest()

    conn.execute(
        "INSERT INTO ledger (prev_hash, payload, timestamp, hash) VALUES (?, ?, ?, ?)",
        (prev_hash, payload_str, timestamp, new_hash),
    )
    conn.commit()
    conn.close()
    return new_hash

def get_tip() -> str:
    conn = get_db()
    row = conn.execute(
        "SELECT hash FROM ledger ORDER BY block_number DESC LIMIT 1"
    ).fetchone()
    conn.close()
    return row["hash"] if row else "0" * 64
