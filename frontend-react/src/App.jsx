// hiregen-react/src/App.jsx
import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import Interview from "./pages/Interview";
import Settings from "./pages/Settings";
import InterviewInstructions from "./components/InterviewInstructions";
import Guidelines from "./pages/Guidelines";

import Platform from "./pages/Platform";
import Resources from "./pages/Resources";
import Legal from "./pages/Legal";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  // Theme Initialization
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Default: go to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Basic Pages */}
          <Route path="/instructions" element={<InterviewInstructions />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/settings" element={<Settings />} />

          {/* Enterprise Pages */}
          <Route path="/platform" element={<Platform />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/legal" element={<Legal />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// Protected Route Component
function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
