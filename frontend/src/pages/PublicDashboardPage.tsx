// frontend/src/pages/PublicDashboardPage.tsx

import { useEffect, useState } from "react";

interface PublicComplaint {
  citizen_id: string;
  complaint_id: string;
  category: string;
  status: string;
  certificate_ready: boolean;
  payment_status: string;
}

interface Stats {
  total_complaints: number;
  resolved: number;
}

interface Reputation {
  contractor_name: string;
  trust_score: number;
  completed_jobs: number;
  verified_jobs: number;
  disputed_jobs: number;
  rejected_jobs: number;
}

const CONTRACTORS = ["ABC Infrastructure", "XYZ Contractors", "Metro Works Ltd"];

const statusColors: Record<string, string> = {
  Reported: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  "Work Started": "bg-orange-100 text-orange-800",
  Resolved: "bg-green-100 text-green-800",
};

export default function PublicDashboardPage() {
  const [complaints, setComplaints] = useState<PublicComplaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reputations, setReputations] = useState<Reputation[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/public/complaints")
      .then((res) => res.json())
      .then(setComplaints);

    fetch("http://localhost:8000/public/stats")
      .then((res) => res.json())
      .then(setStats);

    Promise.all(
      CONTRACTORS.map((name) =>
        fetch(
          `http://localhost:8000/contractors/${encodeURIComponent(name)}/reputation`
        ).then((res) => res.json())
      )
    ).then(setReputations);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Public Transparency Dashboard</h1>

      {/* Stats cards */}
      {stats && (
        <div className="flex gap-4 mb-6">
          <div className="bg-gray-100 rounded p-3 text-sm">
            <div className="font-semibold">Total Complaints</div>
            <div className="text-lg">{stats.total_complaints}</div>
          </div>
          <div className="bg-gray-100 rounded p-3 text-sm">
            <div className="font-semibold">Resolved</div>
            <div className="text-lg">{stats.resolved}</div>
          </div>
        </div>
      )}

      {/* Contractor reputation cards */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">Contractor Reputation</h2>
        <div className="flex gap-4 flex-wrap">
          {reputations.map((r) => (
            <div
              key={r.contractor_name}
              className="border rounded p-3 text-sm w-56"
            >
              <div className="font-semibold">{r.contractor_name}</div>
              <div className="text-2xl font-bold text-blue-700">
                {r.trust_score}%
              </div>
              <div className="text-xs text-gray-500">Trust Score</div>
              <div className="text-xs mt-2">Completed: {r.completed_jobs}</div>
              <div className="text-xs">Verified: {r.verified_jobs}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Complaints table */}
      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Citizen</th>
            <th className="p-2">Complaint ID</th>
            <th className="p-2">Category</th>
            <th className="p-2">Status</th>
            <th className="p-2">Certificate</th>
            <th className="p-2">Payment</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.complaint_id} className="border-b">
              <td className="p-2 font-mono text-xs">{c.citizen_id}</td>
              <td className="p-2 font-mono text-xs">{c.complaint_id}</td>
              <td className="p-2">{c.category}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    statusColors[c.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td className="p-2">
                {c.certificate_ready ? (
                  <a
                    href={`/certificate/${c.complaint_id}`}
                    target="_blank"
                    className="text-blue-600 underline text-xs"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="p-2 text-xs">
                {c.payment_status === "released" ? (
                  <span className="text-green-700">Released</span>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
