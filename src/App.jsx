import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// { changed code }
import { useAuth } from "./components/context/AuthContext";
import UserLogin from "./components/pages/auth/UserLogin";
import ManagerDashboard from "./components/pages/dashboards/ManagerDashboard";
import RequesterDashboard from "./components/pages/dashboards/RequesterDashboard";

import { isRequester } from "./components/utils/roles";

import AdminLogin from "./components/pages/auth/Admin"; // admin login
import AdminDashboard from "./components/pages/dashboards/Admin/AdminDashboard";

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

// Admin Protected Route Component
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // require accessLevel of admin or superadmin
  const access = (user?.accessLevel || "").toString().toLowerCase();
  if (!["admin", "superadmin"].includes(access)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin login + admin protected dashboard */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        {/* Public Routes */}
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
