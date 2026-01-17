// hiregen-react/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import Interview from "./pages/Interview";
import Settings from "./pages/Settings";
import InterviewInstructions from "./components/InterviewInstructions";

export default function App() {
  return (
    <Routes>
      {/* Default: go to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Instructions + Main Pages */}
      <Route path="/instructions" element={<InterviewInstructions />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/settings" element={<Settings />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
