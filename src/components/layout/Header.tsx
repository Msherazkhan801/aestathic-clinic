"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { UserRole } from "@/types";
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  ChevronDown,
  RotateCcw,
  LogOut,
  Sparkles,
  Database,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { role, switchRole, logout, isFirebaseActive } = useAuth();
  const { resetToDefaultSeed } = useData();
  const { showToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setIsDropdownOpen(false);
    showToast(
      `Switched to ${newRole.toUpperCase()} Persona`,
      `Acting as ${DEMO_PERSONAS[newRole].name} (${DEMO_PERSONAS[newRole].title})`,
      "info"
    );

    // Redirect to respective dashboard
    if (newRole === "admin") router.push("/admin");
    else if (newRole === "manager") router.push("/manager");
    else router.push("/user");
  };

  const handleResetData = () => {
    if (
      confirm("Reset all clinic records (appointments, sales, attendance) to default demo seed?")
    ) {
      resetToDefaultSeed();
      showToast(
        "Clinic Database Reset",
        "All procedures, appointments, sales, and employee records have been restored.",
        "success"
      );
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    showToast("Signed Out", "You have returned to the login portal.", "info");
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-dark-bg/85 border-b border-slate-800/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Date & Clinic Pulse */}
      <div className="flex items-center gap-4 pl-12 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">Beverly Hills Flagship Clinic</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Right: Role Switcher & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Firebase Status Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-900/80 border-slate-700 text-slate-400">
          <Database className="w-3 h-3 text-clinic-400" />
          <span>{isFirebaseActive ? "Firestore Connected" : "Local Sync Mode"}</span>
        </div>

        {/* 1-Click Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-white shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span className="capitalize">Role: {role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-dark-surface border border-slate-700 shadow-2xl backdrop-blur-2xl p-2.5 space-y-1.5 z-50 animate-scale-in">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Interactive Role Demo
              </p>

              {/* Admin Persona */}
              <button
                onClick={() => handleRoleChange("admin")}
                className={cn(
                  "w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors",
                  role === "admin"
                    ? "bg-rose-500/10 border border-rose-500/30 text-white"
                    : "hover:bg-slate-800/60 text-slate-300"
                )}
              >
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Admin</p>
                    {role === "admin" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Sheraz khan (Full Clinical Oversight)
                  </p>
                </div>
              </button>

              {/* Manager Persona */}
              <button
                onClick={() => handleRoleChange("manager")}
                className={cn(
                  "w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors",
                  role === "manager"
                    ? "bg-amber-500/10 border border-amber-500/30 text-white"
                    : "hover:bg-slate-800/60 text-slate-300"
                )}
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Manager</p>
                    {role === "manager" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Alexander Wright (HR & Finance)
                  </p>
                </div>
              </button>

              {/* User Persona */}
              <button
                onClick={() => handleRoleChange("user")}
                className={cn(
                  "w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors",
                  role === "user"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-white"
                    : "hover:bg-slate-800/60 text-slate-300"
                )}
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Reception / User</p>
                    {role === "user" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Isabella Rossi (Bookings & Care)
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Quick Reset Demo Seed Button */}
        <button
          onClick={handleResetData}
          title="Reset clinic demo data"
          className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
