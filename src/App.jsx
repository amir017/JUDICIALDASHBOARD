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
import OfficerProfilePage from "./components/OfficerProfilePage";
import DesignationDistricts from "./components/DesignationDistricts";

// ✅ NEW: officer detail page
import OfficerDetailPage from "./components/OfficerDetailPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token"),
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

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

        {/* ✅ NEW ROUTE */}
        <Route
          path="/dashboard/officer-detail"
          element={
            <ProtectedRoute>
              <OfficerDetailPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        {/* ✅ NEW: Officer Profile Route */}
        <Route
          path="/dashboard/officer-profile"
          element={
            <ProtectedRoute>
              <OfficerProfilePage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
