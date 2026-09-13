import { useEffect, useState } from "react";

interface Complaint {
  id: string;
  payload: { text: string; category?: string };
  status: string;
}

const DEMO_CONTRACTOR = "ABC Infrastructure";

function deadlineFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString();
}

export default function ContractorPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [contractorName] = useState(DEMO_CONTRACTOR);
  const [jobs, setJobs] = useState<Complaint[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ confidence: number; pass: boolean } | null>(null);

  // --- 8-1 community simulation state ---
  const [communitySim, setCommunitySim] = useState(false);
  const COMMUNITY_CONFIRMATIONS = 8;
  const COMMUNITY_TOTAL = 10;
  const COMMUNITY_CONFIDENCE = 0.87;

  const loadJobs = () => {
    fetch(
      `http://localhost:8000/complaints?assigned_to=${encodeURIComponent(
        contractorName
      )}`
    )
      .then((res) => res.json())
      .then(setJobs)
      .catch(console.error);
  };

  useEffect(() => {
    if (loggedIn) loadJobs();
  }, [loggedIn]);

  const startWork = (id: string) => {
    setActiveJobId(id);
    setUploaded(false);
    setAfterPhoto(null);
    setVerifyResult(null);
  };

  const uploadAfterPhoto = async () => {
    if (!activeJobId || !afterPhoto) return;
    const formData = new FormData();
    formData.append("after_photo", afterPhoto);

    // --- send community simulation flag ---
    formData.append("community_confirmed", String(communitySim));

    const res = await fetch(
      `http://localhost:8000/complaints/${activeJobId}/after-photo`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    setVerifyResult({ confidence: data.confidence, pass: data.pass });
    setUploaded(true);
    loadJobs();
  };

  const logout = () => {
    setLoggedIn(false);
    setJobs([]);
    setActiveJobId(null);
    setVerifyResult(null);
  };

  if (!loggedIn) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Contractor Login</h1>
        <p className="mb-4 text-sm text-gray-600">
          Logging in as: <strong>{contractorName}</strong>
        </p>
        <button
          onClick={() => setLoggedIn(true)}
          className="bg-blue-600 text-white rounded p-2"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          Assigned Jobs — {contractorName}
        </h1>
        <button
          onClick={logout}
          className="text-sm text-red-600 underline"
        >
          Logout
        </button>
      </div>
      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs assigned yet.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="border rounded p-3">
              <div className="font-mono text-sm">{j.id}</div>
              <div>{j.payload.category ?? "Uncategorized"}</div>
              <div className="text-xs text-gray-500">Status: {j.status}</div>
              <div className="text-xs text-gray-500">
                Deadline: {deadlineFromNow(2)}
              </div>
              {activeJobId !== j.id ? (
                <button
                  onClick={() => startWork(j.id)}
                  className="mt-2 bg-orange-500 text-white text-xs rounded px-3 py-1"
                >
                  Start Work
                </button>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {/* --- Toggle and counter display --- */}
                  <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <input
                      type="checkbox"
                      checked={communitySim}
                      onChange={(e) => setCommunitySim(e.target.checked)}
                    />
                    Simulate community confirmations
                  </label>
                  {communitySim && (
                    <div className="text-xs text-blue-700 mb-2">
                      Community confirmations: {COMMUNITY_CONFIRMATIONS} / {COMMUNITY_TOTAL} (
                      {Math.round(COMMUNITY_CONFIDENCE * 100)}% confidence)
                    </div>
                  )}

                  {/* --- File input remains unchanged --- */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setAfterPhoto(e.target.files?.[0] ?? null)
                    }
                  />
                  <button
                    onClick={uploadAfterPhoto}
                    className="bg-green-600 text-white text-xs rounded px-3 py-1 w-fit"
                  >
                    Upload After Photo
                  </button>
                  {uploaded && verifyResult && (
                    <>
                      {verifyResult.pass ? (
                        <span className="text-xs text-green-700">
                          ✅ Verification passed ({Math.round(verifyResult.confidence * 100)}% confidence)
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">
                          ❌ Verification failed ({Math.round(verifyResult.confidence * 100)}% confidence) — try a clearer after-photo
                        </span>
                      )}
                      {communitySim && (
                        <span className="text-xs text-blue-700">
                          👥 Community confirmations: {COMMUNITY_CONFIRMATIONS}/{COMMUNITY_TOTAL} ({Math.round(COMMUNITY_CONFIDENCE * 100)}% confidence)
                        </span>
                      )}
                      {/* --- 8-4 Community Verified badge --- */}
                      {uploaded && verifyResult?.pass && communitySim && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          🤝 Community Verified
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
