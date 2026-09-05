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
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Default Fixed Credentials (1-Click Auto-Fill)
              </p>
              <span className="text-[10px] text-clinic-300 font-medium">Click to select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {/* Admin Fixed Credential */}
              <div
                onClick={() => handleFillCredentials("admin@sheziaesthetics.com", "admin123")}
                className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                  email === "admin@sheziaesthetics.com"
                    ? "bg-rose-500/20 border-rose-500/60 shadow-[0_0_10px_-2px_rgba(244,63,94,0.4)]"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <p className="text-[11px] text-white font-mono mt-1 truncate">
                  admin@sheziaesthetics.com
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Pass: <span className="text-slate-200">admin123</span>
                </p>
              </div>

              {/* Manager Fixed Credential */}
              <div
                onClick={() => handleFillCredentials("alexander@sheziaesthetics.com", "manager123")}
                className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                  email === "alexander@sheziaesthetics.com"
                    ? "bg-amber-500/20 border-amber-500/60 shadow-[0_0_10px_-2px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Manager</span>
                </div>
                <p className="text-[11px] text-white font-mono mt-1 truncate">
                  alexander@sheziaesthetics.com
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Pass: <span className="text-slate-200">manager123</span>
                </p>
              </div>

              {/* User Fixed Credential */}
              <div
                onClick={() => handleFillCredentials("isabella@sheziaesthetics.com", "user123")}
                className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                  email === "isabella@sheziaesthetics.com"
                    ? "bg-emerald-500/20 border-emerald-500/60 shadow-[0_0_10px_-2px_rgba(16,185,129,0.4)]"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>User</span>
                </div>
                <p className="text-[11px] text-white font-mono mt-1 truncate">
                  isabella@sheziaesthetics.com
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Pass: <span className="text-slate-200">user123</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-light pt-1">
              💡 <em>New User and Manager accounts can be created by the Admin inside the Admin Portal.</em>
            </p>
          </div>
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
