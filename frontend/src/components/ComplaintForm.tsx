import { useState, useEffect } from "react";

export default function ComplaintForm() {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ctnId, setCtnId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false); // ✅ New state
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setLocError(`Location unavailable (${err.message})`)
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append("text", text);
    if (photo) formData.append("before_photo", photo);

    // Attach location
    if (location) {
      formData.append("lat", String(location.lat));
      formData.append("lng", String(location.lng));
    }

    try {
      const res = await fetch("http://localhost:8000/complaints", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      setCtnId(data.id);
      // ✅ Check duplicate flag from backend
      setIsDuplicate(data.duplicate ?? false);
      
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <textarea
        className="border rounded p-2"
        placeholder="Describe the issue..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      {/* Location status */}
      {location ? (
        <span className="text-xs text-gray-500">Location captured ✓</span>
      ) : locError ? (
        <span className="text-xs text-orange-500">{locError}</span>
      ) : (
        <span className="text-xs text-gray-400">Getting location...</span>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
      />
      
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white rounded p-2 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Complaint"}
      </button>
      
      {/* Success Message */}
      {ctnId && (
        <div className="bg-green-100 text-green-800 p-2 rounded">
          Submitted! Your complaint ID: <strong>{ctnId}</strong>
        </div>
      )}
      
      {/* ✅ Duplicate Warning */}
      {isDuplicate && (
        <div className="bg-yellow-100 text-yellow-800 p-2 rounded">
          ⚠️ Possible duplicate of an existing complaint
        </div>
      )}
    </form>
  );
}