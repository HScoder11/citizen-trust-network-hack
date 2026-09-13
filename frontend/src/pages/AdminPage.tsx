// frontend/src/pages/AdminPage.tsx

import { useEffect, useState } from "react";
import AdminDashboard from "../components/AdminDashboard";

export default function AdminPage() {
  const [tipHash, setTipHash] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/ledger/tip")
      .then((res) => res.json())
      .then((data) => setTipHash(data.tip_hash))
      .catch(() => setTipHash("Error loading ledger"));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-gray-100 rounded p-3 text-sm">
        <span className="font-semibold">Latest Ledger Hash: </span>
        <span className="font-mono break-all">
          {tipHash ?? "Loading..."}
        </span>
      </div>

      <div className="mt-6">
        <h2 className="font-bold mb-2">Pending Complaints</h2>
        <AdminDashboard />
      </div>
    </div>
  );
}
