# backend/reputation.py

from db import get_db

def record_verified_job(contractor_name: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM contractor_reputation WHERE contractor_name = ?",
        (contractor_name,)
    ).fetchone()

    if row is None:
        # First entry for this contractor
        conn.execute(
            "INSERT INTO contractor_reputation (contractor_name, completed_jobs, verified_jobs) VALUES (?, 1, 1)",
            (contractor_name,),
        )
    else:
        # Increment counters
        conn.execute(
            "UPDATE contractor_reputation SET completed_jobs = completed_jobs + 1, verified_jobs = verified_jobs + 1 WHERE contractor_name = ?",
            (contractor_name,),
        )

    # Recompute trust score: verified / (verified + disputed + rejected), scaled to 0-100
    row = conn.execute(
        "SELECT verified_jobs, disputed_jobs, rejected_jobs FROM contractor_reputation WHERE contractor_name = ?",
        (contractor_name,),
    ).fetchone()

    verified, disputed, rejected = row["verified_jobs"], row["disputed_jobs"], row["rejected_jobs"]
    total = verified + disputed + rejected
    trust_score = round((verified / total) * 100, 1) if total > 0 else 100

    conn.execute(
        "UPDATE contractor_reputation SET trust_score = ? WHERE contractor_name = ?",
        (trust_score, contractor_name),
    )
    conn.commit()
    conn.close()


def get_reputation(contractor_name: str) -> dict:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM contractor_reputation WHERE contractor_name = ?",
        (contractor_name,)
    ).fetchone()
    conn.close()

    if row is None:
        return {
            "contractor_name": contractor_name,
            "trust_score": 100,
            "completed_jobs": 0,
            "verified_jobs": 0,
            "disputed_jobs": 0,
            "rejected_jobs": 0,
        }

    return dict(row)
