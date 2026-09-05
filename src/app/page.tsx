"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { UserRole } from "@/types";
import {
  Sparkles,
  ShieldCheck,
  Briefcase,
  UserCheck,
  ArrowRight,
  CalendarCheck,
  DollarSign,
  Pill,
  FileBarChart,
  Users,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const { settings } = useData();

  const handleSelectRole = (targetRole: UserRole) => {
    switchRole(targetRole);
    if (targetRole === "admin") router.push("/admin");
    else if (targetRole === "manager") router.push("/manager");
    else router.push("/user");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080B11] via-[#0B0F17] to-[#121824] text-white flex flex-col justify-between selection:bg-clinic-500">
      {/* Top Luxury Navbar */}
      <header className="px-6 py-6 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-clinic-600 via-clinic-500 to-gold-400 flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-widest uppercase font-display">
              {settings.clinicName}
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-clinic-300 font-medium">
              Medical Aesthetics Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-white transition-all shadow-md"
          >
            <Lock className="w-3.5 h-3.5 text-gold-400" />
            <span>Login Portal</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-clinic-500/30 bg-clinic-500/10 text-clinic-200 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Role-Based Clinical Management Platform</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display max-w-4xl leading-tight">
          Seamless Operations for{" "}
          <span className="bg-gradient-to-r from-clinic-300 via-gold-300 to-clinic-500 bg-clip-text text-transparent">
            Aesthetic Medicine Clinics
          </span>
        </h2>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl font-light">
          Unified management of staff attendance, automated payroll, procedure-linked
          sales, pharmacy stock thresholds, appointments, and executive financial reports.
        </p>

        {/* 3 Role Selection Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl text-left">
          {/* Admin Role Card */}
          <div className="relative group rounded-3xl bg-dark-card/90 border border-rose-500/30 hover:border-rose-500/70 p-7 backdrop-blur-2xl shadow-glass-dark hover:shadow-[0_0_35px_-5px_rgba(244,63,94,0.3)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Tier 1 • Full Control
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-display">
                  Admin Portal
                </h3>
                <p className="text-xs text-rose-300 font-medium mt-0.5">
                  Dr. Elena Vance, M.D. (Clinic Director)
                </p>
                <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                  Full system oversight with employee management, global attendance, master
                  profit & loss, salary approval, and clinical settings.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Executive Financial P&L & Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Staff Directory & Full Attendance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Custom Date & Procedure Reports</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectRole("admin")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-clinic-600 hover:from-rose-500 hover:to-clinic-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Enter as Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Manager Role Card */}
          <div className="relative group rounded-3xl bg-dark-card/90 border border-amber-500/30 hover:border-amber-500/70 p-7 backdrop-blur-2xl shadow-glass-dark hover:shadow-[0_0_35px_-5px_rgba(245,158,11,0.3)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Briefcase className="w-7 h-7" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Tier 2 • Operations & Finance
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-display">
                  Manager Portal
                </h3>
                <p className="text-xs text-amber-300 font-medium mt-0.5">
                  Alexander Wright (Clinic Manager)
                </p>
                <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                  Financial controller and HR operations. Record daily cashflow, mark staff
                  attendance, compute monthly payroll, and manage shift schedules.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daily Attendance Marking & Logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Automated Absence Salary Deductions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sales & Expense Ledger with PDF Export</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectRole("manager")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Enter as Manager</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* User / Receptionist Role Card */}
          <div className="relative group rounded-3xl bg-dark-card/90 border border-emerald-500/30 hover:border-emerald-500/70 p-7 backdrop-blur-2xl shadow-glass-dark hover:shadow-[0_0_35px_-5px_rgba(16,185,129,0.3)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Tier 3 • Front Desk & Care
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-display">
                  User / Receptionist
                </h3>
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  Isabella Rossi (Patient Concierge)
                </p>
                <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                  Patient reception, appointment scheduling, treatment price quotes,
                  dispensing pharmacy products, and maintaining patient records.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interactive Appointment Booking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Patient Directory & Treatment History</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cosmeceutical Pharmacy & Stock</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectRole("user")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Enter as Receptionist</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-5xl">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-clinic-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">Daily Attendance</p>
              <p className="text-[11px] text-slate-400">Mark & summarize logs</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-gold-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">Income by Procedure</p>
              <p className="text-[11px] text-slate-400">Date filtered sales</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <Pill className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">Pharmacy Stock</p>
              <p className="text-[11px] text-slate-400">Low-stock alerts</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <FileBarChart className="w-5 h-5 text-rose-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-white">PDF & CSV Exports</p>
              <p className="text-[11px] text-slate-400">Audit-ready reports</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <p>
          © {new Date().getFullYear()} {settings.clinicName} • All rights reserved •
          Designed for Premium Medical Spas & Aesthetic Practices
        </p>
      </footer>
    </div>
  );
}
