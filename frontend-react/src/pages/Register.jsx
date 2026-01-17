// src/pages/Register.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  try {
    // ✅ Directly try to sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://hiregen-ai-uol.web.app", 
      },
    });

   if (signUpError) {
  if (signUpError.message.includes("already registered")) {
    setError("⚠️ Email already exists. Please try logging in.");
  } else if (signUpError.message.includes("rate limit")) {
    setError("⚠️ Too many requests. Please wait a while before trying again.");
  } else {
    setError(signUpError.message);
  }
  return;
}


    if (!data?.user) {
      setError("Something went wrong. Please try again.");
      return;
    }

  
    await supabase.from("users").insert({
      id: data.user.id,
      name,
      cnic,
      email,
      resumeURL: "",
      created_at: new Date(),
    });

    setMessage(
      "✅ Registration successful! Please check your email for a verification link."
    );
  } catch (err) {
    setError("Something went wrong: " + err.message);
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-indigo-600">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-14" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h2>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* ⚠️ Verification Message */}
        {message && (
          <p className="text-red-600 bg-yellow-100 border border-yellow-300 px-4 py-3 rounded mb-4 text-sm">
            {message}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="CNIC (without dashes)"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
