import { supabase } from "../lib/supabase";

// ✅ Add notification only if it doesn't already exist for the user
export async function addNotificationOnce(user_id, message) {
  if (!user_id || !message) return;

  // Check if this exact message already exists for the user
  const { data: existing, error: checkError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user_id)
    .eq("message", message)
    .limit(1);

  if (checkError) {
    console.error("Error checking existing notifications:", checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log("⚠️ Notification already exists. Skipping.");
    return;
  }

  // Insert new notification
  const { data, error } = await supabase
    .from("notifications")
    .insert([{ user_id, message, read: false }]);

  if (error) {
    console.error("Error adding notification:", error);
  } else {
    console.log("✅ Notification added:", data);
  }
}
