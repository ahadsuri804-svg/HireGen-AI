import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Shield, FileWarning, Cookie, Scale } from "lucide-react";

export default function Legal() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Header />

            {/* Hero Section */}
            <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                        Legal & Compliance
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">
                        Transparency is at the core of our business. Review our policies to understand how we protect your data, ensuring fairness and security in every interview.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">Last Updated: October 24, 2025</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">

                {/* Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 px-2">Table of Contents</h3>
                        <nav className="space-y-1">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Compliance"].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                    className="block px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-16">

                    {/* Privacy Policy */}
                    <section id="privacy-policy" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy</h2>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300">
                            <p>
                                HireGen-AI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our monitoring platform.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">1. Data Collection</h4>
                            <p>
                                We collect personally identifiable information (PII) such as names, email addresses, and resumes explicitly provided by candidates. Additionally, during interview sessions, we process biometric data (facial geometry, voiceprints) strictly for the purpose of identity verification and anti-cheating enforcement.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">2. Data Usage & retention</h4>
                            <p>
                                Interview data, including transcripts and recordings, is retained for a period of 90 days by default to allow for hiring decisions and audits, after which it is automatically pseudonymized or deleted, unless a longer retention period is required by law or enterprise contract.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">3. User Rights</h4>
                            <p>
                                Under GDPR and CCPA, users have the right to request access to, correction of, or deletion of their personal data. To exercise these rights, please contact our Data Protection Officer at privacy@hiregen.ai.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

                    {/* Terms of Service */}
                    <section id="terms-of-service" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6">
                            <FileWarning className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Terms of Service</h2>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300">
                            <p>
                                By accessing HireGen-AI, you agree to these Terms. If you disagree with any part of the terms, you may not access the Service.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">1. Acceptable Use</h4>
                            <p>
                                You agree not to misuse the Platform. This includes attempting to bypass anti-cheating mechanisms, reverse engineering the AI models, or using the platform for any illegal purpose.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">2. Limitation of Liability</h4>
                            <p>
                                HireGen-AI provides the service "as is". We are not liable for hiring decisions made based on our AI recommendations. The final hiring decision rests solely with the Employer.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mt-6 mb-2">3. Account Termination</h4>
                            <p>
                                We reserve the right to terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms (e.g., confirmed cheating attempts).
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

                    {/* Cookie Policy */}
                    <section id="cookie-policy" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6">
                            <Cookie className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cookie Policy</h2>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300">
                            <p>
                                We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Essential Cookies:</strong> Required for the operation of the website (e.g., authentication tokens).</li>
                                <li><strong>Analytical Cookies:</strong> Help us understand how visitors interact with the website.</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and choices.</li>
                            </ul>
                            <p className="mt-4">
                                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

                    {/* Compliance */}
                    <section id="compliance" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6">
                            <Scale className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance & Ethics</h2>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                            <h4 className="text-slate-900 dark:text-white font-semibold mb-2">Fair AI Pledge</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                HireGen-AI is dedicated to Ethical AI principles. We regularly audit our models for disparate impact to ensure that no demographic group is unfairly disadvantaged by our scoring algorithms.
                            </p>
                            <h4 className="text-slate-900 dark:text-white font-semibold mb-2">Security Standards</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Our platform architecture is designed to meet SOC 2 Type II controls and ISO 27001 standards (certification pending).
                            </p>
                        </div>
                    </section>

                </div>
            </div>

            <Footer />
        </div>
    );
}
