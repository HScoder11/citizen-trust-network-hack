import { Link, Outlet } from "react-router-dom";

// Mock user object defined outside the component
const mockUser = { name: "Himanshu", role: "Citizen" };

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Title and Mock User */}
      <header className="border-b p-4 flex justify-between items-center">
        <span className="font-bold text-lg">Citizen Trust Network</span>
        <span className="text-sm text-gray-500">
          {mockUser.name} ({mockUser.role})
        </span>
      </header>

      <div className="flex flex-1">
        <nav className="w-48 border-r p-4 flex flex-col gap-2">
          <Link to="/citizen" className="hover:underline">Citizen</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
          <Link to="/contractor" className="hover:underline">Contractor</Link>
        </nav>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>

      <footer className="border-t p-4 text-sm text-gray-500">
        &copy; 2024 Citizen Trust Network. All rights reserved.
      </footer>
    </div>
  );
}