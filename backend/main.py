import math
import uuid
import json
import os
from datetime import datetime
from difflib import SequenceMatcher
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from db import get_db, init_db
from llm_client import LLMClient
from ledger import create_block, get_tip
from verification import compare_images

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
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def haversine_meters(lat1, lng1, lat2, lng2):
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
        "INSERT INTO complaints (id, payload, before_path, voice_path, lat, lng, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            complaint_id,
            json.dumps(payload),
            before_path,
            voice_path,
            lat,
            lng,
            created_at,
            "Reported",   # default status
        ),
    )
    conn.commit()
    conn.close()

    # Immutable ledger entry after complaint insert
    block_hash = create_block({
        "event": "complaint_created",
        "complaint_id": complaint_id,
        **classification,
    })

    return {
        "id": complaint_id,
        "duplicate": is_duplicate,
        "ledger_hash": block_hash,
        **classification,
    }

@app.get("/complaints")
def list_complaints(status: str | None = None, assigned_to: str | None = None):
    conn = get_db()
    query = "SELECT * FROM complaints WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)

    if assigned_to:
        query += " AND assigned_to = ?"
        params.append(assigned_to)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    result = []
    for row in rows:
        d = dict(row)
        try:
            d["payload"] = json.loads(d["payload"])
        except (json.JSONDecodeError, TypeError):
            pass
        result.append(d)
    return result


@app.get("/complaints/{complaint_id}")
def get_complaint(complaint_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    conn.close()
    if not row:
        return {"error": "Not found"}
    d = dict(row)
    d["payload"] = json.loads(d["payload"])
    return d


@app.put("/complaints/{complaint_id}/assign")
def assign_complaint(complaint_id: str, contractor: str = Body(..., embed=True)):
    conn = get_db()
    conn.execute(
        "UPDATE complaints SET assigned_to = ?, status = ? WHERE id = ?",
        (contractor, "Assigned", complaint_id),
    )
    conn.commit()
    conn.close()
    return {"id": complaint_id, "assigned_to": contractor, "status": "Assigned"}

@app.post("/complaints/{complaint_id}/after-photo")
async def upload_after_photo(
    complaint_id: str,
    after_photo: UploadFile = File(...),
    community_confirmed: bool = Form(False),
):
    after_path = f"uploads/{complaint_id}_after_{after_photo.filename}"
    with open(after_path, "wb") as f:
        f.write(await after_photo.read())

    conn = get_db()
    row = conn.execute("SELECT before_path FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
    before_path = row["before_path"] if row else None

    if before_path:
        result = compare_images(before_path, after_path)
    else:
        result = {"confidence": 0.0, "pass": False}

    new_status = "Resolved" if result["pass"] else "Work Started"

    conn.execute(
        "UPDATE complaints SET after_path = ?, status = ?, verification_confidence = ?, verification_pass = ? WHERE id = ?",
        (after_path, new_status, result["confidence"], int(result["pass"]), complaint_id),
    )
    conn.commit()
    conn.close()

    if result["pass"]:
        # Ledger entry for work completion
        create_block({
            "event": "work_completed",
            "complaint_id": complaint_id,
            "confidence": result["confidence"],
        })

        # --- Auto-set certificate_ready (9-4) ---
        conn2 = get_db()
        conn2.execute("UPDATE complaints SET certificate_ready = 1, payment_status = ? WHERE id = ?", ("released",complaint_id,))
        conn2.commit()
        conn2.close()

        # --- 8-3 community confirmation block ---
        if community_confirmed:
            create_block({
                "event": "community_confirmed",
                "complaint_id": complaint_id,
                "confidence": 0.87,
                "confirmations": "8/10",
            })

    return {
        "id": complaint_id,
        "status": new_status,
        "confidence": result["confidence"],
        "pass": result["pass"],
    }


@app.get("/ledger/tip")
def ledger_tip():
    return {"tip_hash": get_tip()}


@app.get("/ledger/all")
def ledger_all():
    conn = get_db()
    rows = conn.execute("SELECT * FROM ledger ORDER BY block_number").fetchall()
    conn.close()
    return [dict(row) for row in rows]
