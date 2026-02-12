import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, Bell, User, X, Menu } from "lucide-react";
import { supabase } from "../lib/supabase";
// import { addNotificationOnce } from "./notifications";
// import { deleteNotification } from "./notifications";

export default function Header() {
  // 🔔 Static Initial Notifications (Dummy Data)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "👋 Welcome to HireGen-AI! Your personal AI interviewer is ready.",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      message: "📢 Don't forget to upload your Resume to customize your interview session.",
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 3,
      message: "💡 Pro Tip: Ensure you are in a quiet environment before starting.",
      read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // NOTE: Real-time logic removed as per request for "ready made" dummy notifications.

  // 📬 Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ Mark all as read
  const markAllRead = () => {
    // Simplified/Dummy implementation to prevent crash
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Optional: Valid Supabase call if needed later
    /*
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id);
    }
    */
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Premium UI Structure ---
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex-shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="HireGen-AI Logo" className="h-10 w-auto object-contain" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">HireGen-AI</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Enterprise Edition</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/platform" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Platform</Link>
            <Link to="/resources" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Resources</Link>
            <Link to="/legal" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Legal</Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  markAllRead();
                }}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 ring-1 ring-black ring-opacity-5 py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                  </div>
                  <ul className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400 italic">No new notifications</li>
                    ) : (
                      notifications.map((n) => (
                        <li key={n.id} className="group relative px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // deleteNotification(n.id); // Disabled for dummy mode
                                setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                              title="Dismiss"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-center">
                    <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Mark all read</button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Profile & Settings (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/settings"
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>

              <Link to="/profile" className="flex items-center gap-3 pl-2 group">
                <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 ring-2 ring-white dark:ring-slate-800 shadow-sm group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800 transition-all">
                  <User className="h-5 w-5" />
                </div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Settings className="h-6 w-6 rotate-90" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/platform" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Platform</Link>
            <Link to="/resources" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Resources</Link>
            <Link to="/legal" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Legal</Link>
            <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
            <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
          </div>
        </div>
      )}
    </header>
  );
}
