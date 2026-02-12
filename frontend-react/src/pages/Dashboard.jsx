// hiregen-react/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FileText, Video, MessageSquare, Info, Download, X, Mic, Code, ShieldCheck } from "lucide-react";
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

  // Report State
  const [reportStatus, setReportStatus] = useState("pending"); // pending, ready
  const [reportFiles, setReportFiles] = useState({ evaluation: null, transcript: null }); // Store both files
  const [showReportModal, setShowReportModal] = useState(false);

  const { user, userName: globalUserName } = useAuth(); // Use global name
  const navigate = useNavigate();

  // Update local state if global name is available
  useEffect(() => {
    if (globalUserName) {
      setUserName(globalUserName);
    }
  }, [globalUserName]);

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

      const res = await fetch("http://20.98.82.167/upload-resume", {
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

      if (data.error) {
        throw new Error(data.error);
      }
      if (!data.session_id) {
        throw new Error("No session ID returned from server.");
      }

      setSessionId(data.session_id);
      // 🔒 USER ISOLATION: Logout clears this key, so we can trust it.
      localStorage.setItem("resumeSessionId", data.session_id);

      // Reset report status on new session
      setReportStatus("pending");
      setReportFiles({ evaluation: null, transcript: null });

      alert("✅ Resume uploaded & session created!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // 🔒 USER ISOLATION: Logout clears this key, so we can trust it.
    const savedSessionId = localStorage.getItem("resumeSessionId");
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
  }, []);

  // Poll for Report Status
  useEffect(() => {
    let interval;
    if (sessionId) {
      const checkReportStatus = async () => {
        try {
          const res = await fetch(`http://20.98.82.167/report_status/${sessionId}`);
          const data = await res.json();
          if (data.status === "ready") {
            setReportStatus("ready");
            setReportFiles({
              evaluation: data.evaluation || data.filename, // Handle both old/new format
              transcript: data.transcript
            });
            clearInterval(interval);
            addNotificationOnce("Your feedback report is ready!");
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      };

      // Check immediately + interval
      checkReportStatus();
      interval = setInterval(checkReportStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("resumeURL") // Only fetch resumeURL now, name is global
            .eq("id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            // setUserName(data.name || ""); // Handled globally now
            if (data.resumeURL) setResumeURL(data.resumeURL);
          }
        } catch (err) {
          console.error("Failed to fetch user doc:", err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // --- Derived State for UI Progress ---
  const hasResume = !!sessionId; // Assuming session ID implies resume uploaded for now (or check resumeURL)
  const isInterviewDone = reportStatus === "ready";

  // Progress Calculation
  const currentStep = isInterviewDone ? 3 : hasResume ? 2 : 1;
  const progressPercent = isInterviewDone ? 100 : hasResume ? 66 : 33;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">

        {/* HERO SECTION */}
        <div className="mb-12 text-center md:text-left md:flex md:items-end md:justify-between border-b border-slate-200 dark:border-slate-800 pb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{userName || "Candidate"}</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Your AI-powered career acceleration platform. Prepare for your next big role with
              industry-standard interviews and detailed performance analytics.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex gap-4">
            <button
              onClick={() => navigate("/guidelines")}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-all"
            >
              <Info className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
              Guidelines
            </button>
          </div>
        </div>

        {/* PROGRESS OVERVIEW (SaaS Style) */}
        <div className="mb-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Application Progress</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progressPercent)}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className={currentStep >= 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>Step 1: Resume</span>
            <span className={currentStep >= 2 ? "text-indigo-600 dark:text-indigo-400" : ""}>Step 2: Interview</span>
            <span className={currentStep >= 3 ? "text-indigo-600 dark:text-indigo-400" : ""}>Step 3: Evaluation</span>
          </div>
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* CARD 1: UPLOAD RESUME */}
          <div className={`relative group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col ${hasResume ? "ring-2 ring-green-500/10 dark:ring-green-500/20" : ""}`}>
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="h-24 w-24 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-lg ${hasResume ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"}`}>
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resume Upload</h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {hasResume ? "Completed" : "Step 1"}
                </span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-4 flex-grow leading-relaxed">
              Upload your CV to let our AI analyze your profile and tailor the interview questions to your experience level.
            </p>

            {hasResume && (
              <div className="mb-4 text-center">
                <a
                  href={`http://20.98.82.167/download-resume/${user?.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200 dark:border-indigo-800"
                >
                  <FileText className="h-4 w-4" />
                  View Current Resume
                </a>
              </div>
            )}

            <div className={`mt-auto border-2 border-dashed rounded-xl p-6 text-center transition-colors relative ${file ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}>
              {hasResume && !file ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Resume On File
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Click or Drag to Replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {!file && <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop your file here or click to browse</p>}
                  {file && <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate px-2">{file.name}</p>}
                </div>
              )}

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Uploading...
                  </span>
                ) : "Confirm Upload"}
              </button>
            )}
          </div>

          {/* CARD 2: START INTERVIEW */}
          <div className="relative group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300 flex flex-col">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Video className="h-24 w-24 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Video className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Virtual Interview</h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Step 2</span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed">
              Enter the secure interview environment. The AI will ask questions based on your resume and role.
              <span className="block mt-2 text-sm text-slate-500 dark:text-slate-500 italic">Requires Camera & Microphone permissions.</span>
            </p>

            <div className="mt-auto">
              <button
                onClick={() => navigate("/instructions")}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Initialize Session</span>
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>

          {/* CARD 3: FEEDBACK REPORT */}
          <div className={`relative group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 hover:shadow-xl hover:border-purple-100 dark:hover:border-purple-900 transition-all duration-300 flex flex-col ${reportStatus === "ready" ? "ring-2 ring-purple-600/20" : "opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"}`}>
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageSquare className="h-24 w-24 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-lg ${reportStatus === "ready" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"}`}>
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analytics Report</h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Step 3</span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed">
              Comprehensive breakdown of your soft skills, technical knowledge, and body language analysis.
            </p>

            <div className="mt-auto">
              {reportStatus === "ready" ? (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-900 shadow-lg shadow-purple-600/30 transition-all animate-pulse-slow"
                >
                  <Download className="mr-2 h-4 w-4" />
                  View Results
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 text-sm font-bold rounded-xl cursor-not-allowed"
                >
                  {reportStatus === "pending" && sessionId ? "Analysis in Progress..." : "Pending Interview"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: INSTRUCTIONS or INFO */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col lg:flex-row items-start gap-10">
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 group">
              <img src="/dashboard.jpg" alt="Platform Preview" className="w-full h-56 object-cover transform transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="font-bold text-lg">AI-Powered Analysis</p>
                <p className="text-xs text-slate-200">State-of-the-art Evaluation Engine</p>
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-indigo-800 dark:text-indigo-300 text-sm font-medium italic">
                "Our system uses advanced Large Language Models (LLMs) and Computer Vision to simulate a Fortune 500 technical interview."
              </p>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">How HireGen-AI Works</h4>
            <p className="text-slate-600 dark:text-slate-400 text-base mb-8 leading-relaxed max-w-2xl">
              We analyze facial expressions, speech patterns, and technical accuracy to provide a holistic score.
              Experience a comprehensive evaluation that mirrors real-world hiring standards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Feature 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Real-time Audio Processing</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Analyzes speech clarity, tone, and confidence levels instantly.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors group">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Behavioral Analysis</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Computer vision tracks eye contact, posture, and facial expressions.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Code className="h-6 w-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Technical Scoring</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">LLM-powered assessment of code accuracy and problem-solving skills.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-700 transition-colors group">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Cheating Detection</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Strict monitoring for multiple voices, objects, and tab switching.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* REPORT MODAL - PREMIUM STYLE */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden transform transition-all scale-100">

            {/* Modal Header */}
            <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Assessment Report</h3>
                  <p className="text-indigo-100 text-xs">Generated via HireGen Engine</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <p className="text-slate-600 mb-8 text-center leading-relaxed">
                Your performance has been evaluated against industry standards.
                Download your reports below for a deep dive into your strengths and areas for growth.
              </p>

              <div className="space-y-4">
                {reportFiles.evaluation && (
                  <a
                    href={`http://20.98.82.167/download_report_file/${reportFiles.evaluation}`}
                    download
                    className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Evaluation Matrix</p>
                        <p className="text-xs text-slate-500">PDF • Detailed Scoring</p>
                      </div>
                    </div>
                    <Download className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                  </a>
                )}

                {reportFiles.transcript && (
                  <a
                    href={`http://20.98.82.167/download_report_file/${reportFiles.transcript}`}
                    download
                    className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Conversation Transcript</p>
                        <p className="text-xs text-slate-500">PDF • Full Log</p>
                      </div>
                    </div>
                    <Download className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                  </a>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
              <button onClick={() => setShowReportModal(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}