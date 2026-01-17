// src/components/notifications.jsx
import { supabase } from "../lib/supabase";

/**
 * Adds a notification for the current user, only if it doesn't already exist
 * @param {string} message - The notification text
 */
export async function addNotificationOnce(message) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if this message already exists for this user
  const { data: existing, error: checkError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("message", message);

  if (checkError) {
    console.error("Error checking notifications:", checkError.message);
    return;
  }

  if (!existing || existing.length === 0) {
    const { error: insertError } = await supabase.from("notifications").insert([
      {
        user_id: user.id,
        message,
        read: false,
      },
    ]);

    if (insertError) {
      console.error("Error adding notification:", insertError.message);
    } else {
      console.log("✅ Notification added:", message);
    }
  } else {
    console.log("⚠️ Notification already exists, not adding duplicate");
  }
}
// ❌ Delete a single notification
export async function deleteNotification(id) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting notification:", error.message);
  } else {
    console.log("🗑️ Notification deleted:", id);
  }
}