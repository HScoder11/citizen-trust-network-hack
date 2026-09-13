# backend/main.py

import math
import uuid
import json
import os
from datetime import datetime
from difflib import SequenceMatcher
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from db import get_db, init_db
from llm_client import LLMClient
from ledger import create_block, get_tip   # <-- integrate ledger functions

# Load environment variables from .env file FIRST
load_dotenv()

# Access the Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

app = FastAPI()

# Initialize LLM client (single instance for all requests)
llm_client = LLMClient()

# Enable CORS for frontend (allow all origins for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and uploads folder on startup
init_db()
os.makedirs("uploads", exist_ok=True)

# --- Helper Functions ---

def text_similarity(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings (0.0 to 1.0)."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def haversine_meters(lat1, lng1, lat2, lng2):
    """Calculate distance in meters between two GPS coordinates."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

# --- Routes ---

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/complaints")
async def create_complaint(
    text: str = Form(...),
    before_photo: UploadFile | None = File(None),
    voice_note: UploadFile | None = File(None),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
):
    if not text.strip():
        return {"error": "Complaint text is required"}

    complaint_id = "CTN-" + uuid.uuid4().hex[:8].upper()
    classification = llm_client.classify(text)

    before_path, voice_path = None, None

    if before_photo and before_photo.filename:
        before_path = f"uploads/{complaint_id}_{before_photo.filename}"
        with open(before_path, "wb") as f:
            f.write(await before_photo.read())

    if voice_note and voice_note.filename:
        voice_path = f"uploads/{complaint_id}_{voice_note.filename}"
        with open(voice_path, "wb") as f:
            f.write(await voice_note.read())

    # Dedup check
    is_duplicate = False
    conn = get_db()
    existing = conn.execute("SELECT payload, lat, lng FROM complaints").fetchall()
    for row in existing:
        try:
            existing_text = json.loads(row["payload"]).get("text", "")
        except (json.JSONDecodeError, TypeError):
            continue
        sim = text_similarity(text, existing_text)
        if sim > 0.8:
            if (lat is not None and lng is not None and 
                row["lat"] is not None and row["lng"] is not None):
                dist = haversine_meters(lat, lng, row["lat"], row["lng"])
                if dist < 5:
                    is_duplicate = True
                    break
            else:
                is_duplicate = True
                break
    conn.close()

    payload = {"text": text, **classification}
    created_at = datetime.utcnow().isoformat()

    conn = get_db()
    conn.execute(
        "INSERT INTO complaints (id, payload, before_path, voice_path, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (complaint_id, json.dumps(payload), before_path, voice_path, lat, lng, created_at),
    )
    conn.commit()
    conn.close()

    # Immutable ledger entry after complaint insert
    block_hash = create_block({
        "event": "complaint_created",
        "complaint_id": complaint_id,
        **classification,
    })

    return {"id": complaint_id, "duplicate": is_duplicate, "ledger_hash": block_hash, **classification}

@app.get("/ledger/tip")
def ledger_tip():
    return {"tip_hash": get_tip()}

# Debug endpoint to inspect full ledger chain
@app.get("/ledger/all")
def ledger_all():
    conn = get_db()
    rows = conn.execute("SELECT * FROM ledger ORDER BY block_number").fetchall()
    conn.close()
    return [dict(row) for row in rows]
