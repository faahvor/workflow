// src/App.jsx (or src/components/App.jsx)

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./components/context/AuthContext";
import UserLogin from "./components/pages/auth/UserLogin";
import ManagerDashboard from "./components/pages/dashboards/ManagerDashboard";
import RequesterDashboard from "./components/pages/dashboards/RequesterDashboard";
import { isRequester, isManager, isDirector } from "./components/utils/roles";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Dashboard Router - Redirects to appropriate dashboard based on role
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is a requester
  if (isRequester(user.role)) {
    return <RequesterDashboard />;
  }

  // Check if user is a manager or director (all use ManagerDashboard)
  if (isManager(user.role) || isDirector(user.role)) {
    return <ManagerDashboard />;
  }

  // For specialized roles (Procurement, Shipping, Accounting, etc.)
  // They also use ManagerDashboard
  return <ManagerDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<UserLogin />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
