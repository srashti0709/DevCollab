
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DarkLogin from "./components/DarkLogin";
import LightLogin from "./components/LightLogin";
import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";

function LoginPage() {
  const [dark, setDark] = useState(true);

  const handleToggleTheme = () => {
    setDark((current) => !current);
  };

  return dark ? (
    <DarkLogin onToggleTheme={handleToggleTheme} />
  ) : (
    <LightLogin onToggleTheme={handleToggleTheme} />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<AccountSettings />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
