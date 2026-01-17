// hiregen-react/src/pages/UploadResume.jsx
import React, { useState } from "react";
import { useAuth } from "../AuthProvider";
import addNotificationOnce from "./notifications";

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);

  async function onUpload() {
    
    if (!file) return alert("⚠️ Choose a file first.");
    if (!user) return alert("⚠️ Please login first.");

    try {
      setProgress(5);

      const formData = new FormData();
      formData.append("file", file);

      // optional: attach user id if you want the backend to know who uploaded
      formData.append("user_id", user.id);

      setProgress(15);

      const res = await fetch("http://localhost:8000/upload-resume", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Upload failed: ${res.status} ${body}`);
      }

      const data = await res.json();
      setProgress(100);

      // response expected: { session_id, filename, message, parsed?: {...} }
      console.log("Upload response", data);
      setSessionId(data.session_id || null);

      addNotificationOnce("success", "Resume uploaded. Session ID: " + (data.session_id || "n/a"));
    } catch (err) {
      console.error("Upload error:", err);
      addNotificationOnce("error", "Upload failed: " + err.message);
      alert("Upload failed: " + err.message);
      setProgress(0);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">Upload Resume</h2>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div className="mt-3">
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded"
          onClick={onUpload}
        >
          Upload
        </button>
      </div>

      {progress > 0 && <div className="mt-2">Progress: {progress}%</div>}

      {sessionId && (
        <div className="mt-3 text-sm">
          Session created: <strong>{sessionId}</strong>
        </div>
      )}
    </div>
  );
}
