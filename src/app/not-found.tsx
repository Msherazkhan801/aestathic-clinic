"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-dark-card border border-slate-800 shadow-glass-dark animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-clinic-500/10 border border-clinic-500/30 flex items-center justify-center mx-auto text-clinic-400">
          <Sparkles className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-white font-display">404</h1>
          <h2 className="text-lg font-bold text-slate-200 mt-1">Page Not Found</h2>
          <p className="text-xs text-slate-400 font-light mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
