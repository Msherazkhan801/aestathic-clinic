"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  CreditCard,
  Calendar,
  Pill,
  Sparkle,
  Contact,
  FileBarChart,
  Settings,
  Clock,
  Eye,
  Menu,
  X,
  ShieldCheck,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const { settings } = useData();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define navigation items per role
  const adminNav = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Staff & User Accounts", href: "/admin/employees", icon: Users },
    { label: "Attendance Sheet", href: "/admin/attendance", icon: CalendarCheck },
    { label: "Income & Expenses", href: "/admin/finance", icon: DollarSign },
    { label: "Salaries & Payroll", href: "/admin/salaries", icon: CreditCard },
    { label: "Appointments", href: "/admin/appointments", icon: Calendar },
    { label: "Pharmacy Inventory", href: "/admin/pharmacy", icon: Pill },
    { label: "Treatments Catalog", href: "/admin/treatments", icon: Sparkle },
    { label: "Patient Contacts", href: "/admin/contacts", icon: Contact },
    { label: "Reports & Exports", href: "/admin/reports", icon: FileBarChart },
    { label: "Clinic Settings", href: "/admin/settings", icon: Settings },
  ];

  const managerNav = [
    { label: "Manager Dashboard", href: "/manager", icon: LayoutDashboard },
    { label: "Mark Attendance", href: "/manager/attendance", icon: CalendarCheck },
    { label: "Record Sales & Expenses", href: "/manager/finance", icon: DollarSign },
    { label: "Salary Calculation", href: "/manager/salaries", icon: CreditCard },
    { label: "Staff Shift Timings", href: "/manager/employees", icon: Clock },
    { label: "Financial Reports", href: "/manager/reports", icon: FileBarChart },
    { label: "Clinic Directory View", href: "/manager/view-modules", icon: Eye },
  ];

  const userNav = [
    { label: "Reception Overview", href: "/user", icon: LayoutDashboard },
    { label: "Book Appointments", href: "/user/appointments", icon: Calendar },
    { label: "Patient Directory", href: "/user/contacts", icon: Contact },
    { label: "Treatment Price List", href: "/user/treatments", icon: Sparkle },
    { label: "Pharmacy Stock & Dispense", href: "/user/pharmacy", icon: Pill },
  ];

  const navItems = role === "admin" ? adminNav : role === "manager" ? managerNav : userNav;

  const roleMeta = {
    admin: {
      label: "Admin Portal",
      badge: "Full System Oversight",
      icon: ShieldCheck,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    },
    manager: {
      label: "Manager Portal",
      badge: "HR & Financial Controller",
      icon: Briefcase,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    user: {
      label: "User Portal",
      badge: "Reception & Customer Care",
      icon: UserCheck,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
  }[role];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-dark-card border border-slate-700 text-slate-200 shadow-xl"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-30 w-72 bg-dark-surface/95 border-r border-slate-800/90 backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <Link
            href={role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/user"}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-clinic-600 via-clinic-500 to-gold-400 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider text-white font-display uppercase group-hover:text-clinic-300 transition-colors">
                {settings.clinicName}
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Aesthetic Management
              </p>
            </div>
          </Link>

          {/* Active Role Badge */}
          <div
            className={cn(
              "mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold",
              roleMeta.color
            )}
          >
            <roleMeta.icon className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate leading-tight">{roleMeta.label}</p>
              <p className="text-[10px] opacity-75 font-light truncate">
                {roleMeta.badge}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-clinic-500/20 to-gold-500/10 text-white border border-clinic-500/40 shadow-glow font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-clinic-400 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-clinic-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-clinic-500/40 bg-slate-800 flex items-center justify-center flex-shrink-0">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-clinic-400">
                  {user?.displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user?.role} Access
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
