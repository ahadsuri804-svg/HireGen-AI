import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bot, BarChart3, ShieldAlert, Lock, CheckCircle2, Cpu, Eye, FileText } from "lucide-react";

export default function Platform() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-slate-900/90" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-6">
                        Enterprise Grade
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
                        The World's Most Advanced <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            AI Interview Engine
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
                        HireGen-AI isn't just a chatbot. It's a cohesive, multi-modal assessment platform designed to rigorously evaluate technical talent with human-level nuance and machine-level precision.
                    </p>
                </div>
            </section>

            {/* Navigation Anchor Bar */}
            <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8 overflow-x-auto no-scrollbar py-4">
                        {["Interview Engine", "Candidate Analytics", "Anti-Cheating", "Enterprise Security"].map((item) => (
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

                {/* Interview Engine */}
                <section id="interview-engine" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                            <Bot className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Adaptive Interview Engine</h2>
                        <div className="prose prose-slate text-slate-600 dark:text-slate-300 space-y-4">
                            <p>
                                Our core engine utilizes state-of-the-art Large Language Models (LLMs) tuned specifically for technical interviewing. Unlike static script-based tools, HireGen-AI dynamically adapts its questioning strategy based on the candidate's responses.
                            </p>
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Context-Aware Dialogue:</strong> The AI remembers previous turns, creating a coherent, flowing conversation rather than a disjointed Q&A session.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Deep Technical Probing:</strong> If a candidate claims expertise in a specific niche (e.g., "PostgreSQL Indexing"), the engine generates specific deep-dive questions to validate that claim.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Human-Like Latency & Voice:</strong> Integrated with ultra-low latency text-to-speech and speech-to-text modules to simulate a natural video call environment.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl opacity-10 blur-2xl" />
                        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8">
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0" />
                                    <div className="space-y-2 flex-1 text-right">
                                        <div className="h-4 bg-indigo-50 dark:bg-indigo-900/30 rounded w-full ml-auto" />
                                        <div className="h-4 bg-indigo-50 dark:bg-indigo-900/30 rounded w-2/3 ml-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 text-center">
                                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 py-2 px-4 rounded-full inline-block">
                                    Processing latency: &lt; 800ms
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Candidate Analytics */}
                <section id="candidate-analytics" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-10 blur-2xl" />
                        <img
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                            alt="Analytics Dashboard"
                            className="relative rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
                        />
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Evidence-Based Analytics</h2>
                        <div className="prose prose-slate text-slate-600 dark:text-slate-300 space-y-4">
                            <p>
                                We believe in "Show, Don't Tell." Every score generated by HireGen-AI is backed by specific evidence extracted from the interview transcript. We utilize a multi-dimensional scoring matrix that eliminates human bias.
                            </p>
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Transcript-Driven Scoring:</strong> Evaluation is directly tied to lines of dialogue, allowing recruiters to audit exactly why a candidate received a certain score.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Bias-Aware Analysis:</strong> Our evaluation models are calibrated to focus purely on technical correctness, logical reasoning, and communication clarity, ignoring accent, gender, or background.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Decision Support:</strong> We provide a clear "Recommended / Not Recommended" signal along with a detailed PDF report for hiring committees.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Anti-Cheating */}
                <section id="anti-cheating" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Proctor-Level Integrity</h2>
                        <div className="prose prose-slate text-slate-600 dark:text-slate-300 space-y-4">
                            <p>
                                Remote interviews are prone to malpractice. HireGen-AI integrates a proprietary computer vision module that runs locally in real-time to ensure the integrity of the assessment.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Gaze Tracking</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Detects reading off-screen scripts or secondary monitors.</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" />
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Object Detection</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identifies unauthorized devices like phones, books, or additional people.</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                                The strict 3-Strike Rule ensures immediate disqualification upon repeated violations, maintaining a fair playing field for honest candidates.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-10 blur-2xl" />
                        <div className="relative bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
                            <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500 text-red-400 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                LIVE MONITORING
                            </div>
                            <div className="h-64 flex items-center justify-center opacity-50">
                                <div className="text-slate-500 font-mono text-sm">[Computer Vision Feed Simulation]</div>
                            </div>
                            <div className="bg-slate-800 p-4 border-t border-slate-700">
                                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                                    <span>Face Detect: <span className="text-green-400">ACTIVE</span></span>
                                    <span>Audio Analysis: <span className="text-green-400">ACTIVE</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Enterprise Security */}
                <section id="enterprise-security" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-10 blur-2xl" />
                        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">End-to-End Encryption</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">AES-256 standards for all data at rest and in transit.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Audit-Ready Logs</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Immutable access logs for compliance auditing.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Security First Architecture</h2>
                        <div className="prose prose-slate text-slate-600 dark:text-slate-300 space-y-4">
                            <p>
                                We understand that interview data is sensitive PII. Our infrastructure is built with security as a foundational principle, not an afterthought.
                            </p>
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Secure WebSocket Communication:</strong> All real-time audio/video streams are transmitted via WSS with strictly enforced session isolation.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Session Isolation:</strong> Each interview runs in a containerized environment, ensuring no cross-contamination of candidate data.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 mr-3 flex-shrink-0" />
                                    <span><strong>Privacy Compliance:</strong> Built to align with GDPR and CCPA standards regarding data retention and candidate rights.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}
