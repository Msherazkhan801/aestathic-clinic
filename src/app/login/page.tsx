"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { UserRole } from "@/types";
import {
  Sparkles,
  Lock,
  Mail,
  ShieldCheck,
  Briefcase,
  UserCheck,
  ArrowRight,
  Database,
  KeyRound,
  Info,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, isFirebaseActive } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("admin@sheziaesthetics.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      showToast("Missing Fields", "Please enter both your work email and password.", "warning");
      setLoading(false);
      return;
    }

    const result = await loginWithEmail(email, password);

    if (result.success) {
      const targetRole = result.role || "user";
      showToast(
        "Authentication Successful",
        `Welcome back, ${result.name || "Staff Member"} (${targetRole.toUpperCase()}).`,
        "success"
      );

      if (targetRole === "admin") router.push("/admin");
      else if (targetRole === "manager") router.push("/manager");
      else router.push("/user");
    } else {
      const err = result.error || "Authentication failed. Invalid email or password.";
      setErrorMessage(err);
      showToast("Sign In Failed", err, "error");
    }
    setLoading(false);
  };

  const handleFillCredentials = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080B11] via-[#0B0F17] to-[#121824] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-clinic-600 via-clinic-500 to-gold-400 flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-wider text-white font-display uppercase group-hover:text-clinic-300 transition-colors">
              SHEZI AESTHETICS
            </h1>
          </Link>
          <p className="text-xs text-slate-400 font-light">
            Authorized Personnel & Clinical Access Portal
          </p>
        </div>

        {/* Main Login Card */}
        <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-2xl shadow-glass-dark space-y-6">
          {/* Header & Access Notice */}
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Lock className="w-4 h-4 text-clinic-400" />
              <span>Staff Login</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized clinical credentials to access your designated workspace.
            </p>
          </div>

          {/* Error Callout */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <Info className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sheziaesthetics.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-clinic-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-clinic-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-clinic-500 via-gold-500 to-clinic-600 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>Sign In to Clinical Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Fixed Default Credentials Quick Selector */}
      
        </div>

        {/* System Info */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-clinic-400" />
            <span>
              {isFirebaseActive
                ? "Connected to Firebase Cloud Authentication & Firestore"
                : "Active in Local Hybrid Mode • Secure Role-Based Gateways"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
