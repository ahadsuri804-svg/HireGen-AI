
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function saveChatMessage(sender, message) {
  if (!auth.currentUser) return;

  const chatRef = collection(db, "users", auth.currentUser.uid, "interviewChat");
  try {
    await addDoc(chatRef, {
      sender,
      message,
      timestamp: serverTimestamp(),
    });
    console.log("Chat saved:", message);
  } catch (error) {
    console.error("Error saving chat:", error);
  }
}
