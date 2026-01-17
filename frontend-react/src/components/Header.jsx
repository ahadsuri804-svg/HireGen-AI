import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, Bell, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { addNotificationOnce } from "./notifications";
import { deleteNotification } from "./notifications";

export default function Header() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
 useEffect(() => {
    const sendNotification = async () => {
      await addNotificationOnce("🤖 Your AI Interview Session is Ready! You can take your interviewv any time at once only.");
       await addNotificationOnce("📢 Must upload your Resume for smooth flow of your Interview Session.");
    };

    sendNotification();
  }, []);
 useEffect(() => {
  const loadNotifications = async () => {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("Error getting user:", userErr);
      return;
    }
    if (!user) return;

    const { data, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchErr) console.error("Fetch notifications error:", fetchErr);
    else setNotifications(data || []);
  };

  loadNotifications();
}, []);

  // 🔔 Real-time listener for new notifications
  useEffect(() => {
    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((n) =>
                n.id === payload.new.id ? payload.new : n
              );
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 📬 Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ Mark all as read
  const markAllRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
       .from("user_notifications")
  .upsert({ user_id, notification_id, dismissed: true })
      .eq("user_id", user.id)
      .eq("read", false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white shadow-md">
      {/* Left: Logo + Title */}
      <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" className="h-10" />
        <h1 className="text-xl font-bold tracking-wide">HireGen-AI</h1>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4 relative">
        {/* 🔔 Notifications */}
        <div className="relative">
          <Bell
            className="h-6 w-6 cursor-pointer hover:text-gray-200 transition"
            onClick={() => {
              setShowNotifications(!showNotifications);
              markAllRead();
            }}
          />

         {unreadCount > 0 && (
  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
    {unreadCount > 9 ? "9+" : unreadCount}
  </span>
)}


          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded shadow-lg p-2 z-50">
              <p className="font-semibold mb-2">Notifications</p>
              <ul>
                {notifications.length === 0 && (
                  <li className="py-2 text-sm">No notifications</li>
                )}
               {notifications.map((n) => (
  <li
    key={n.id}
    className={`group flex justify-between items-start border-b py-2 text-sm px-1 hover:bg-gray-50 rounded transition-all ${
     n.message
    }`}
  >
    <span className="pr-2">{n.message}</span>

    {/* ❌ Dismiss Button */}
    <button
      onClick={async () => {
        await deleteNotification(n.id);
        setNotifications((prev) => prev.filter((item) => item.id !== n.id));
      }}
      className="text-gray-400 hover:text-red-500 text-xs ml-2 mt-0.5 transition-opacity opacity-0 group-hover:opacity-100"
      title="Dismiss"
    >
      ✕
    </button>
  </li>
))}

              </ul>
            </div>
          )}
        </div>

        {/* 👤 Profile */}
        <Link to="/profile" className="hover:text-gray-200 transition">
          <User className="h-6 w-6" />
        </Link>

        {/* ⚙️ Settings */}
        <Link to="/settings" className="hover:text-gray-200 transition">
          <Settings className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}
