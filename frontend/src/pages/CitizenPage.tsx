import ComplaintForm from "../components/ComplaintForm";

export default function CitizenPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">File a Complaint</h1>
      <ComplaintForm />
    </div>
  );
}