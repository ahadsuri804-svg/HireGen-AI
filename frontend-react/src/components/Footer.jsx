// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-4 mt-10 shadow-inner">
      <p className="text-center text-sm text-gray-600">
        © {new Date().getFullYear()} HireGen-AI by Ahad & Waseem. FYP Fall'2025 — The University Of Lahore. All rights reserved.
      </p>
    </footer>
  );
}
