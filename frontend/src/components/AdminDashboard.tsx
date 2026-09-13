// frontend/src/components/AdminDashboard.tsx

import { useEffect, useState } from "react";

const CONTRACTORS = ["ABC Infrastructure", "XYZ Contractors", "Metro Works Ltd"];

const statusColors: Record<string, string> = {
  Reported: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  "Work Started": "bg-orange-100 text-orange-800",
  Resolved: "bg-green-100 text-green-800",
};

function badgeClass(status: string) {
  return statusColors[status] ?? "bg-gray-100 text-gray-800";
}

interface Complaint {
  id: string;
  payload: {
    text: string;
    category?: string;
    priority?: string;
    location?: string;
  };
  status: string;
  assigned_to: string | null;
  certificate_ready: number;   // <-- new field
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const loadComplaints = () => {
    fetch("http://localhost:8000/complaints") // show ALL complaints
      .then((res) => res.json())
      .then(setComplaints)
      .catch(console.error);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const assignContractor = async (id: string, contractor: string) => {
    if (!contractor) return;
    await fetch(`http://localhost:8000/complaints/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractor }),
    });
    loadComplaints(); // refresh the table so status/assigned_to update
  };

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">ID</th>
          <th className="p-2">Category</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Location</th>
          <th className="p-2">Status</th>
          <th className="p-2">Assign</th>
          <th className="p-2">Certificate</th> {/* --- new column --- */}
        </tr>
      </thead>
      <tbody>
        {complaints.map((c) => (
          <tr key={c.id} className="border-b">
            <td className="p-2 font-mono">{c.id}</td>
            <td className="p-2">{c.payload.category ?? "-"}</td>
            <td className="p-2">{c.payload.priority ?? "-"}</td>
            <td className="p-2">{c.payload.location ?? "-"}</td>
            <td className="p-2">
              <span
                className={`px-2 py-1 rounded text-xs ${badgeClass(c.status)}`}
              >
                {c.status}
              </span>
            </td>
            <td className="p-2">
              {c.assigned_to ? (
                <span className="text-xs text-gray-600">{c.assigned_to}</span>
              ) : (
                <select
                  className="border rounded text-xs p-1"
                  defaultValue=""
                  onChange={(e) => assignContractor(c.id, e.target.value)}
                >
                  <option value="" disabled>
                    Assign to...
                  </option>
                  {CONTRACTORS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </td>
            <td className="p-2">
              {c.certificate_ready ? (
                <a
                  href={`/certificate/${c.id}`}
                  target="_blank"
                  className="text-blue-600 underline text-xs"
                >
                  📜 Certificate Available
                </a>
              ) : (
                <span className="text-xs text-gray-400">Pending</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
