import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useAuth } from "../AuthProvider";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  User, Moon, Sun, Bell, Shield, HelpCircle, LogOut, ChevronRight, Mail, FileText
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Load initial theme state
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    // 🔒 USER ISOLATION: Clear session on logout
    localStorage.removeItem("resumeSessionId");

    await supabase.auth.signOut();
    navigate("/login");
  };

  const SectionTitle = ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-2">
      {children}
    </h3>
  );

  const SettingRow = ({ icon: Icon, title, description, action, danger }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${danger ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={`font-medium ${danger ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
            {title}
          </p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account preferences and application settings.</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
            {/* Placeholder Avatar */}
            <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500">
              <User className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div className="mb-10">
          <SectionTitle>Account</SectionTitle>
          <SettingRow
            icon={User}
            title="Profile Information"
            description={user?.email || "Manage your personal details"}
            action={
              <button onClick={() => navigate("/profile")} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            }
          />
        </div>

        {/* PREFERENCES SECTION */}
        <div className="mb-10">
          <SectionTitle>Preferences</SectionTitle>

          {/* Dark Mode */}
          <SettingRow
            icon={darkMode ? Moon : Sun}
            title="Appearance"
            description={darkMode ? "Dark mode is enabled" : "Light mode is enabled"}
            action={
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            }
          />

          {/* Notifications */}
          <SettingRow
            icon={Bell}
            title="Email Notifications"
            description="Receive updates about your interview reports"
            action={
              <button
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${emailNotifs ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifs ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            }
          />
        </div>

        {/* SUPPORT SECTION */}
        <div className="mb-10">
          <SectionTitle>Support & Legal</SectionTitle>

          <SettingRow
            icon={HelpCircle}
            title="Help Center"
            description="Guides, FAQs, and support resources"
            action={
              <button onClick={() => navigate("/resources")} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            }
          />

          <SettingRow
            icon={Shield}
            title="Privacy & Security"
            description="Review our privacy policy and security standards"
            action={
              <button onClick={() => navigate("/legal")} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            }
          />
          <SettingRow
            icon={Mail}
            title="Contact Support"
            description="Get help with your account"
            action={
              <a href="mailto:support@hiregen.ai" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                Email Us
              </a>
            }
          />
        </div>

        {/* DANGER ZONE */}
        <div>
          <SectionTitle>Session</SectionTitle>
          <SettingRow
            icon={LogOut}
            title="Log Out"
            description="Sign out of your account on this device"
            danger
            action={
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                title="Sign out"
              >
                Log Out
              </button>
            }
          />
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            HireGen-AI v2.4.0 (Enterprise Build) <br />
            User ID: {user?.id || "Unknown"}
          </p>
        </div>

      </main>
    </div>
  );
}
