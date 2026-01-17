// src/components/InterviewInstructions.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { addNotificationOnce } from "../components/notifications";
export default function InterviewInstructions() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (agreed) {
      navigate("/interview");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Interview Instructions</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
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

      <div className="flex items-center mt-6">
        <input
          type="checkbox"
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="mr-2"
        />
        <span className="text-gray-800">I have read and understood all instructions.</span>
      </div>

      <button
        onClick={handleStart}
        disabled={!agreed}
        className={`mt-6 w-full py-3 rounded-lg font-semibold ${
          agreed
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Submit
      </button>
    </div>
  );
}
