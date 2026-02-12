import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { BookOpen, Code2, LineChart, HelpCircle, FileText, Terminal, ArrowRight, ExternalLink } from "lucide-react";

export default function Resources() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Header />

            {/* Hero Section */}
            <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
                            Resources & Documentation
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
                            Everything you need to integrate, manage, and scale your hiring process with HireGen-AI.
                            Explore our comprehensive guides and references.
                        </p>
                    </div>
                </div>
            </section>

            {/* Navigation Anchor Bar */}
            <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8 overflow-x-auto no-scrollbar py-4">
                        {["Documentation", "API Reference", "Case Studies", "Help Center"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

                {/* Documentation */}
                <section id="documentation" className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Documentation</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Quick Start Guide</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Set up your first interview session in under 5 minutes. Learn about resume parsing and session configuration.</p>
                            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center">Read Guide <ArrowRight className="h-4 w-4 ml-1" /></span>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Interpreting Reports</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Deep dive into our analytical scoring matrix. Understand what the "Confidence Score" and "Technical Depth" metrics mean.</p>
                            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center">Read Guide <ArrowRight className="h-4 w-4 ml-1" /></span>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Admin Workflows</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Managing recruiter accounts, setting up role-based access control, and reviewing team performance.</p>
                            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center">Read Guide <ArrowRight className="h-4 w-4 ml-1" /></span>
                        </div>
                    </div>
                </section>

                {/* API Reference */}
                <section id="api-reference" className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">API Reference</h2>
                    </div>

                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-8 lg:p-12">
                                <h3 className="text-white text-xl font-semibold mb-4">REST & WebSocket API</h3>
                                <p className="text-slate-400 mb-6">
                                    Programmatically manage interviews, retrieve reports, and integrate HireGen-AI directly into your ATS (Applicant Tracking System).
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="h-6 w-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono mr-3 mt-1">GET</div>
                                        <div>
                                            <code className="text-white font-mono text-sm">/v1/interviews/{'{session_id}'}/report</code>
                                            <p className="text-sm text-slate-500 mt-1">Retrieve the PDF and JSON report for a completed session.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="h-6 w-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono mr-3 mt-1">POST</div>
                                        <div>
                                            <code className="text-white font-mono text-sm">/v1/webhooks/interview-completed</code>
                                            <p className="text-sm text-slate-500 mt-1">Receive real-time callbacks when a candidate finishes.</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center">
                                    View Full API Docs <ExternalLink className="h-4 w-4 ml-2" />
                                </button>
                            </div>
                            <div className="bg-slate-950 p-8 font-mono text-xs overflow-x-auto border-l border-slate-800">
                                <pre className="text-slate-300">
                                    {`{
  "session_id": "c7b3d8e0-5e0b-4b0f-8b3a-1b5d4e6f4a2",
  "candidate": {
    "name": "Sarah Chen",
    "email": "sarah.c@example.com"
  },
  "scores": {
    "technical": 8.5,
    "communication": 9.2,
    "overall": 8.8
  },
  "status": "completed",
  "cheating_flags": 0,
  "completed_at": "2024-03-15T10:30:00Z"
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Case Studies */}
                <section id="case-studies" className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <LineChart className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Case Studies</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div> {/* Logo Placeholder */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Scaling Engineering Teams by 300%</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                How a Series B Fintech startup used HireGen-AI to screen 1,500+ candidates in one month, saving 400+ hours of engineering time.
                            </p>
                            <div className="flex gap-8 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">400h+</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Time Saved</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">98%</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Placement Success</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
                            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div> {/* Logo Placeholder */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eliminating Bias in Enterprise Hiring</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                A Fortune 500 tech giant deployed HireGen-AI to standardize their initial technical screen, resulting in a 40% increase in diverse candidate throughput.
                            </p>
                            <div className="flex gap-8 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">40%</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Diversity Increase</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">10k+</div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Interviews Run</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Help Center */}
                <section id="help-center" className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Help Center</h2>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-8 border border-amber-100 dark:border-amber-900/30 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                                <ul className="space-y-4">
                                    <li>
                                        <details className="group">
                                            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-800 dark:text-slate-200">
                                                <span>Can I customize the interview questions?</span>
                                                <span className="transition group-open:rotate-180">
                                                    <span className="block h-4 w-4">▼</span>
                                                </span>
                                            </summary>
                                            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm group-open:animate-fadeIn">
                                                Yes, enterprise plans allow for custom prompt injection and domain-specific knowledge bases to tailor the AI's questioning strategy.
                                            </p>
                                        </details>
                                    </li>
                                    <div className="h-px bg-amber-200/50 dark:bg-amber-700/50"></div>
                                    <li>
                                        <details className="group">
                                            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-800 dark:text-slate-200">
                                                <span>What happens if a candidate loses internet?</span>
                                                <span className="transition group-open:rotate-180">
                                                    <span className="block h-4 w-4">▼</span>
                                                </span>
                                            </summary>
                                            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm group-open:animate-fadeIn">
                                                The session state is persisted. Candidates can rejoin within a configurable grace period (default 5 mins) and resume exactly where they left off.
                                            </p>
                                        </details>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Support</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                                    Our dedicated enterprise support team is available 24/7 for critical issues and integration assistance.
                                </p>
                                <div className="space-y-2">
                                    <a href="mailto:support@hiregen.ai" className="block w-full bg-white dark:bg-slate-800 text-center py-2 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                        Email Support
                                    </a>
                                    <a href="#" className="block w-full bg-indigo-600 text-white text-center py-2 rounded hover:bg-indigo-700 transition">
                                        Open Live Chat
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}
