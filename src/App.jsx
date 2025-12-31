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
import NewDashboard from "./components/pages/NewDashboard";
import NewDashboard2 from "./components/pages/NewDashboard2";
import RequestDetailDemo from "./components/pages/RequestDetailDemo";
import { isRequester } from "./components/utils/roles";
import SignaturePage from "./components/pages/signature";
import VendorPage from "./components/pages/vendor";
import Inventory from "./components/pages/Inventory";
import RequestDetailModal from "./components/pages/RequestDetailModal";
import AdminLogin from "./components/pages/auth/Admin"; // admin login
import AdminDashboard from "./components/pages/dashboards/Admin/AdminDashboard";
import Notification from "./components/pages/dashboards/Notification";
import ChatRoom from "./components/pages/dashboards/ChatRoom";
import Support from "./components/pages/dashboards/Support";

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
        <Route path="/ndb" element={<NewDashboard />} />
        <Route path="/ndb2" element={<NewDashboard2 />} />
        <Route path="/request-demo" element={<RequestDetailDemo />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/request" element={<RequestDetailModal />} />
        <Route path="/vendor" element={<VendorPage />} />
        <Route path="/inventory" element={<Inventory />} />

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
