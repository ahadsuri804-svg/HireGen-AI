import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { supabase } from "../lib/supabase";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { Eye, EyeOff, Lock, User, Mail, CreditCard, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    cnic: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (user) {
      alert("⚠️ You are already logged in! Redirecting to dashboard...");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // CNIC Masking Logic (XXXXX-XXXXXXX-X)
  const handleCnicChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 13) value = value.slice(0, 13);

    // Apply formatting
    let formattedCnic = value;
    if (value.length > 5) {
      formattedCnic = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    if (value.length > 12) {
      formattedCnic = `${formattedCnic.slice(0, 13)}-${value.slice(12)}`;
    }

    setFormData({ ...formData, cnic: formattedCnic });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = () => {
    const { name, cnic, email, password, confirmPassword } = formData;
    const cnicDigits = cnic.replace(/\D/g, "");
    return (
      name.length > 2 &&
      cnicDigits.length === 13 &&
      email.includes("@") &&
      password.length >= 8 &&
      password === confirmPassword &&
      agreed
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: "https://hiregen-ai-uol.web.app",
        },
      });

      if (signUpError) throw signUpError;

      if (!data?.user) throw new Error("Registration failed. Please try again.");

      // 2. Create User Profile
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        name: formData.name,
        cnic: formData.cnic, // Store formatted or raw? Usually strings are fine.
        email: formData.email,
        resumeURL: "",
        created_at: new Date(),
      });

      if (profileError) throw profileError;

      setSuccess("✅ Account created successfully! retrieving verification link...");

    } catch (err) {
      if (err.message.includes("already registered")) {
        setError("Email already registered. Please login.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">

      {/* LEFT PANEL - BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-900 opacity-90"></div>
        <img
          src="/dashboard.jpg"
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />
        <div className="relative z-10 flex flex-col justify-between p-16 h-full text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <ShieldCheck className="h-8 w-8 text-indigo-300" />
              </div>
              <span className="text-2xl font-bold tracking-tight">HireGen AI</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Join the Future of <br /> <span className="text-indigo-300">Technical Hiring</span>
            </h1>
            <p className="text-lg text-indigo-100 max-w-md leading-relaxed">
              Create your professional profile today. Secure, AI-powered, and designed for top-tier enterprises.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm font-medium text-indigo-200">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Bank-grade Security</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> AI Verification</span>
            </div>
            <p className="text-xs text-indigo-300/60">© 2026 HireGen AI. enterprise Edition.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <img src="/logo.png" alt="HireGen Logo" className="h-10" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Create Account</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your details to access the secure candidate portal.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* CNIC */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                CNIC Number <span className="text-xs font-normal text-slate-400 ml-1">(Secure Identity Verification)</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="cnic"
                  placeholder="35202-1234567-8"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono tracking-wide"
                  value={formData.cnic}
                  onChange={handleCnicChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 relative">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 dark:border-slate-700"
                      }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <PasswordStrengthMeter password={formData.password} />

            {/* Terms Box */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
                I agree to the <Link to="/legal" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link> and <Link to="/legal" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>.
                I understand that my CNIC is used strictly for identity verification purposes.
              </label>
            </div>

            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Secure Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already vetted?{" "}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline">
              Access Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
