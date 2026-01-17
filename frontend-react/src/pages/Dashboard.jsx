// hiregen-react/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FileText, Video, MessageSquare, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { supabase } from "../lib/supabase";
import { addNotificationOnce } from "../components/notifications";
export default function Dashboard() {
  const [userName, setUserName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeURL, setResumeURL] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const { user } = useAuth();
  

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

const handleUpload = async () => {
  if (!user || !user.id) {
    alert("⚠️ User not loaded yet. Please login again.");
    return;
  }

  if (!file) {
    alert("⚠️ Please select a resume first.");
    return;
  }

  setUploading(true);

  try {
    console.log("UPLOAD CLICKED");
    console.log("Selected file:", file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user.id);

    console.log("Sending resume to backend...");

    const res = await fetch("http://localhost:8000/upload-resume", {
      method: "POST",
      body: formData,
    });

    console.log("Backend response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Backend upload failed");
    }

    const data = await res.json();
    console.log("Backend response data:", data);

    setSessionId(data.session_id);
    localStorage.setItem("resumeSessionId", data.session_id);

    alert("✅ Resume uploaded & session created!");
  } catch (err) {
    console.error("Upload error:", err);
    alert("❌ Upload failed: " + err.message);
  } finally {
    setUploading(false);
  }
};

useEffect(() => {
  const savedSessionId = localStorage.getItem("resumeSessionId");
  if (savedSessionId) {
    setSessionId(savedSessionId);
  }
}, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("name, resumeURL")
            .eq("id", user.id) 
            .single();

          if (error) throw error;

          if (data) {
            setUserName(data.name || "");
            if (data.resumeURL) setResumeURL(data.resumeURL);
          }
        } catch (err) {
          console.error("Failed to fetch user doc:", err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome {userName || "User"}
        </h2>

        <p className="text-gray-600 mb-8">
          HireGen-AI is your AI-powered career companion. With real job
          interviews powered by artificial intelligence, you can face
          industry-level questions, get evaluated instantly, and experience the
          pressure of a real interview environment. Upload your resume, start
          your interview, and receive a detailed feedback report that highlights
          your strengths and areas for improvement.
        </p>

        <div className="mb-8 flex justify-center">
          <img
            src="/dashboard.jpg"
            alt="Dashboard"
            className="rounded-lg shadow-lg max-h-82"
          />
        </div>

        <div className="mb-8">
          <button
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
            onClick={() =>
              alert(
                "📘 Instructions:\n\n1. Upload your CV/Resume (File should be PDF/DOC format and file size up to 10 MB).\n2. Start your Interview at any time. Read instructions carefully.\n3. After your Interview you can get detailed AI feedback by dowlaoading your Feedback Report.\n\nTips: Stay confident and answer naturally! Don't take more delay's more than 5 seconds while answering the questions"
              )
            }
          >
            <Info className="h-5 w-5" />
            <span>View Instructions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Upload Resume */}
  <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition">
    <FileText className="h-10 w-10 text-indigo-600 mx-auto mb-3" />
    <h3 className="font-bold text-lg">Upload Resume</h3>
    <p className="text-sm text-gray-600 mt-2">
      Upload your resume to let AI analyze your profile. Make sure the file must be in pdf/docx with up to 10MB size.
    </p>
    <div className="mt-4">
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
{user && (
  <div className="mt-3 text-sm text-green-600 space-y-2">
    <p>✅ Resume uploaded successfully!</p>

    <div className="flex justify-center gap-4">
      {/* Download Resume from Backend */}
      <a
       href={`http://localhost:8000/download-resume/${user.id}`}
        className="underline text-green-700"
      >
        Download Resume
      </a>
    </div>
  </div>
)}

    </div>
  </div>

  {/* Start Interview */}
  <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition">
    <Video className="h-10 w-10 text-green-600 mx-auto mb-3" />
    <h3 className="font-bold text-lg">Start AI-Powered Interview Session</h3>
    <p className="text-sm text-gray-600 mt-2">
      Begin your AI-powered interview simulation.
    </p>
    <button
      onClick={() => navigate("/instructions")}
      className="bg-blue-700 text-white px-4 py-2 mt-9 rounded-lg hover:bg-blue-900 transition"
    >
      Start Interview
    </button>
  </div>

  {/* Feedback Report */}
  <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition">
    <MessageSquare className="h-10 w-10 text-purple-600 mx-auto mb-3" />
    <h3 className="font-bold text-lg">Feedback Report</h3>
    <p className="text-sm text-gray-600 mt-2">
      Get instant feedback with strengths & improvements.
    </p>
    <button
      onClick={() => navigate("")}
      className="bg-blue-700 text-white px-4 py-2 mt-9 rounded-lg hover:bg-blue-900 transition"
    >
      Get Report
    </button>
  </div>
</div>
      </main>

      <Footer />
    </div>
  );
}