// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  // --- Premium Footer Structure ---
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center">
                <img src="/logo.png" alt="HireGen-AI Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">HireGen-AI</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              The enterprise standard for AI-driven candidate evaluation and technical interviewing.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/platform#interview-engine" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Interview Engine</Link></li>
              <li><Link to="/platform#candidate-analytics" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Candidate Analytics</Link></li>
              <li><Link to="/platform#anti-cheating" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Anti-Cheating</Link></li>
              <li><Link to="/platform#enterprise-security" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Enterprise Security</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/resources#documentation" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Documentation</Link></li>
              <li><Link to="/resources#api-reference" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">API Reference</Link></li>
              <li><Link to="/resources#case-studies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Case Studies</Link></li>
              <li><Link to="/resources#help-center" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/legal#privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Privacy Policy</Link></li>
              <li><Link to="/legal#terms-of-service" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Terms of Service</Link></li>
              <li><Link to="/legal#cookie-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Cookie Policy</Link></li>
              <li><Link to="/legal#compliance" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Compliance</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} HireGen-AI. All rights reserved. Built by Ahad & Waseem ( FYP Fall'2025 - The University of Lahore )
          </p>
          <div className="flex gap-4">
            {/* Social Placeholders */}
            <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
