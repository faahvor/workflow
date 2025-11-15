// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import UserLogin from "./pages/auth/UserLogin";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import RequesterDashboard from "./pages/dashboards/RequesterDashboard";
import { isRequester } from "./utils/roles";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Smart Dashboard Router - Determines which dashboard to show
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is a requester, show RequesterDashboard
  if (isRequester(user.role)) {
    return <RequesterDashboard />;
  }

  // Otherwise, show ManagerDashboard (for all managers, directors, etc.)
  return <ManagerDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<UserLogin />} />

        {/* Protected Dashboard Route - Automatically routes to correct dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;