import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import DiarySearchScreen from "./components/DiarySearchScreenQR";
import UserDashboard from "./components/UserDashboard";
import DiaryTracking from "./components/DiaryTracking";
import MyFiles from "./components/MyFiles";
import DesignationDistricts from "./components/DesignationDistricts";

import OfficerDetailPage from "./components/OfficerDetailPage";
import OfficerProfilePage from "./components/OfficerProfilePage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token"),
  );

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Protected */}
        <Route
          path="/DiarySearchScreenQR"
          element={
            <ProtectedRoute>
              <DiarySearchScreen onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/UserDashboard"
          element={
            <ProtectedRoute>
              <UserDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/diaryTracking"
          element={
            <ProtectedRoute>
              <DiaryTracking onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myFiles"
          element={
            <ProtectedRoute>
              <MyFiles onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/designation-districts"
          element={
            <ProtectedRoute>
              <DesignationDistricts onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/officer-detail"
          element={
            <ProtectedRoute>
              <OfficerDetailPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ✅ Officer Profile (SINGLE PAGE with split tab components) */}
        <Route
          path="/dashboard/officer-profile"
          element={
            <ProtectedRoute>
              <OfficerProfilePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
