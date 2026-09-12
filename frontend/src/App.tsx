import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import CitizenPage from "./pages/CitizenPage";
import AdminPage from "./pages/AdminPage";
import ContractorPage from "./pages/ContractorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Parent route with no path, just the Layout element */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/citizen" replace />} />
          <Route path="/citizen" element={<CitizenPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/contractor" element={<ContractorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}