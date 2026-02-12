import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Info, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function Guidelines() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
            <Header />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">

                {/* Back Button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

                    {/* Header */}
                    <div className="bg-indigo-600 dark:bg-indigo-700 px-8 py-8 text-center text-white">
                        <Info className="h-12 w-12 mx-auto mb-4 text-indigo-200" />
                        <h1 className="text-3xl font-bold mb-2">Interview Guidelines</h1>
                        <p className="text-indigo-100 max-w-2xl mx-auto">
                            Please review the following instructions carefully to ensure a successful and valid interview session.
                        </p>
                    </div>

                    <div className="p-8 md:p-12 space-y-8">

                        {/* Prerequisities */}
                        <section>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                                Prerequisites
                            </h3>
                            <ul className="space-y-3 text-slate-600 dark:text-slate-300 pl-7 list-disc">
                                <li><strong>Resume Upload:</strong> You must upload your resume before starting the session. The AI uses this to tailor questions.</li>
                                <li><strong>Stable Connection:</strong> Ensure you have a reliable internet connection. Disconnections may be flagged as suspicious.</li>
                                <li><strong>Hardware:</strong> A working webcam and microphone are mandatory.</li>
                            </ul>
                        </section>

                        <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                        {/* During Interview */}
                        <section>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                                During the Session
                            </h3>
                            <ul className="space-y-3 text-slate-600 dark:text-slate-300 pl-7 list-disc">
                                <li><strong>Environment:</strong> Sit in a quiet, well-lit room. Ensure your background is clear of distractions.</li>
                                <li><strong>Visibility:</strong> Your full face must remain visible to the camera at all times. Maintain eye contact.</li>
                                <li><strong>Time Limit:</strong> Manage your time wisely. The AI will guide the flow, but concise answers are appreciated.</li>
                                <li><strong>No Navigation:</strong> Do not switch tabs or minimize the browser window. Navigation away from the interview page is not allowed.</li>
                            </ul>
                        </section>

                        <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                        {/* Anti-Cheating */}
                        <section>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                Strict Anti-Cheating Policy
                            </h3>
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-6">
                                <p className="text-red-800 dark:text-red-300 font-medium mb-4">
                                    Cheating detection is active throughout the session. Any suspicious activity will be flagged and may lead to disqualification.
                                </p>
                                <ul className="space-y-2 text-red-700 dark:text-red-400 text-sm list-disc pl-5">
                                    <li>No external devices (phones, tablets) allowed.</li>
                                    <li>No secondary monitors or reading from off-screen notes.</li>
                                    <li>No other people in the room.</li>
                                    <li><strong>3-Strike Rule:</strong> You will receive a maximum of 3 warnings. On the 3rd warning, the interview will automatically terminate.</li>
                                </ul>
                            </div>
                        </section>

                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 px-8 py-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Close Guidelines
                        </button>
                        <button
                            onClick={() => navigate("/instructions")}
                            className="ml-4 px-6 py-2.5 bg-indigo-600 text-white shadow-sm text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Proceed to Interview
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
