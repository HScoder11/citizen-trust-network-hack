import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface ComplaintDetail {
  id: string;
  assigned_to: string | null;
  verification_confidence: number | null;
  certificate_ready: number;
  created_at: string;
}

export default function CertificatePage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [tipHash, setTipHash] = useState<string>("");

  useEffect(() => {
    fetch(`http://localhost:8000/complaints/${id}`)
      .then((res) => res.json())
      .then(setComplaint);

    fetch("http://localhost:8000/ledger/tip")
      .then((res) => res.json())
      .then((data) => setTipHash(data.tip_hash));
  }, [id]);

  if (!complaint) return <div className="p-6">Loading...</div>;

  if (!complaint.certificate_ready) {
    return (
      <div className="p-6">
        Certificate not yet available for this complaint.
      </div>
    );
  }

  const certId = "CERT-" + complaint.id.replace("CTN-", "");

  return (
    <div className="p-6 max-w-md mx-auto border-2 border-gray-800 rounded-lg">
      <h1 className="text-xl font-bold text-center mb-4">
        Compliance Certificate
      </h1>
      <div className="space-y-2 text-sm">
        <div><strong>Certificate ID:</strong> {certId}</div>
        <div><strong>Complaint ID:</strong> {complaint.id}</div>
        <div><strong>Contractor:</strong> {complaint.assigned_to ?? "N/A"}</div>
        <div>
          <strong>Verification Confidence:</strong>{" "}
          {Math.round((complaint.verification_confidence ?? 0) * 100)}%
        </div>
        <div>
          <strong>Ledger Hash:</strong>{" "}
          <span className="font-mono text-xs break-all">{tipHash}</span>
        </div>
        <div>
          <strong>Timestamp:</strong>{" "}
          {new Date(complaint.created_at).toLocaleString()}
        </div>
      </div>
      <button
        onClick={() => window.print()}
        className="mt-4 bg-blue-600 text-white rounded p-2 w-full"
      >
        Download PDF
      </button>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Note: community confirmation scores are simulated for this demo (no real IoT/community sensor integration).
      </p>
    </div>
  );
}
