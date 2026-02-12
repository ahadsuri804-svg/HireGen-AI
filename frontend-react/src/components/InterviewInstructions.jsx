// src/components/InterviewInstructions.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { addNotificationOnce } from "../components/notifications";
import Header from "../components/Header";

export default function InterviewInstructions() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (agreed) {
      navigate("/interview");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800 transition-colors">
          <h2 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">Interview Instructions</h2>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-100 dark:border-slate-700/50">
            <ul className="list-disc list-inside space-y-3 text-slate-700 dark:text-slate-300 text-sm md:text-base">
              <li>Must Upload your Resume before strating the Interview Session.</li>
              <li>Make sure your background is clear.</li>
              <li>Maintain eye contact with the camera at all times.</li>
              <li>No irregular actions or suspicious behavior.</li>
              <li>Cheating detection is enabled. Any suspicious activity will be flagged.</li>
              <li>You will receive a maximum of <strong>3 warnings</strong>. On the 3rd warning, the interview will automatically end and you will fail.</li>
              <li>The interview will continue until stopped by AI. You cannot end the interview manually.</li>
              <li>Navigation away from this page is not allowed (no going back).</li>
              <li>Your full body and face must remain visible in front of the camera.</li>
              <li>There is a time limit for the interview. Manage your answers wisely.</li>
              <li>Stable internet connection is required. Disconnection may count as a violation.</li>
              <li>No external help or devices allowed during the interview.</li>
            </ul>
          </div>

          <div className="flex items-center mb-8 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              id="agree-checkbox"
            />
            <label htmlFor="agree-checkbox" className="text-slate-800 dark:text-slate-200 font-medium cursor-pointer select-none">
              I have read and understood all instructions.
            </label>
          </div>

          <button
            onClick={handleStart}
            disabled={!agreed}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform ${agreed
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}
