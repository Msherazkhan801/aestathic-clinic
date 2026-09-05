"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, switchRole } = useAuth();

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Fallback unauthorized view
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-bold text-white font-display">
          Restricted Portal Access
        </h3>
        <p className="text-sm text-slate-400">
          This management section requires{" "}
          <span className="font-semibold text-rose-400 uppercase">
            {allowedRoles.join(" or ")}
          </span>{" "}
          authorization privileges. You are currently logged in as{" "}
          <span className="font-semibold text-slate-200 capitalize">{role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => switchRole(allowedRoles[0])}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 text-white font-bold text-sm shadow-glow hover:opacity-90 transition-opacity"
        >
          Switch to {allowedRoles[0].toUpperCase()} Mode
        </button>
        <Link
          href={role === "manager" ? "/manager" : "/user"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
        >
          <span>Go to My Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
