"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AppointmentStatus } from "@/types";
import {
  Calendar,
  UserCheck,
  Plus,
  Users,
  Clock,
  Sparkle,
  Pill,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function UserOverviewPage() {
  const { appointments, contacts, pharmacy, treatments, updateAppointment } = useData();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.appointmentDate === todayStr),
    [appointments, todayStr]
  );

  const completedToday = todayAppointments.filter((a) => a.status === "completed").length;
  const inProgressToday = todayAppointments.filter((a) => a.status === "in-progress").length;
  const upcomingToday = todayAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;

  const handleQuickStatus = (aptId: string, status: AppointmentStatus, name: string) => {
    updateAppointment(aptId, { status });
    showToast(
      "Patient Checked In",
      `${name} marked as ${status.toUpperCase()}.`,
      "success"
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-dark-card to-slate-900 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-glass-dark">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Front Desk Concierge & Reception</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Welcome, Isabella Rossi
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
              Manage incoming patients, schedule clinical appointments, look up prices, and dispense post-care products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/user/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
            <Link
              href="/user/contacts"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Users className="w-4 h-4 text-clinic-400" />
              <span>New Patient</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle={`${upcomingToday} upcoming today`}
          icon={Calendar}
          variant="emerald"
        />
        <StatCard
          title="In Treatment Room"
          value={inProgressToday}
          subtitle="Currently with doctor"
          icon={Clock}
          variant="gold"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          subtitle="Treatment finished"
          icon={CheckCircle2}
          variant="rose"
        />
        <StatCard
          title="Registered Patients"
          value={contacts.length}
          subtitle="In CRM records"
          icon={Users}
          variant="slate"
        />
      </div>

      {/* Today's Live Schedule Queue */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Today&apos;s Patient Reception Queue ({formatDate(todayStr)})
            </h3>
            <p className="text-xs text-slate-400">
              Check in patients upon arrival and track treatment status
            </p>
          </div>
          <Link
            href="/user/appointments"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Full Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {todayAppointments.length > 0 ? (
            todayAppointments.map((apt) => (
              <div
                key={apt.appointmentId}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatTime(apt.appointmentTime)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{apt.customerName}</p>
                    <p className="text-xs text-clinic-300 font-medium">
                      {apt.procedureName} • With {apt.employeeName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Phone: {apt.customerPhone} {apt.notes && `• Note: ${apt.notes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <StatusBadge status={apt.status} />

                  <div className="flex items-center gap-1.5">
                    {apt.status === "scheduled" && (
                      <button
                        onClick={() =>
                          handleQuickStatus(apt.appointmentId, "confirmed", apt.customerName)
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                      >
                        Check In
                      </button>
                    )}
                    {apt.status === "confirmed" && (
                      <button
                        onClick={() =>
                          handleQuickStatus(apt.appointmentId, "in-progress", apt.customerName)
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                      >
                        Send to Doctor
                      </button>
                    )}
                    {apt.status === "in-progress" && (
                      <button
                        onClick={() =>
                          handleQuickStatus(apt.appointmentId, "completed", apt.customerName)
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              No appointments scheduled for today yet.
            </p>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/user/contacts"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-emerald-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-2"
        >
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display group-hover:text-emerald-300">
            Patient CRM Directory
          </h4>
          <p className="text-xs text-slate-400 font-light">
            Search patient records, check skin sensitivity, and view consultation histories.
          </p>
        </Link>

        <Link
          href="/user/treatments"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-clinic-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-2"
        >
          <div className="p-3 rounded-2xl bg-clinic-500/10 text-clinic-400 border border-clinic-500/20 w-fit">
            <Sparkle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display group-hover:text-clinic-300">
            Treatment Price Lookup
          </h4>
          <p className="text-xs text-slate-400 font-light">
            Quickly check session durations, categories, and prices to quote inquiring clients.
          </p>
        </Link>

        <Link
          href="/user/pharmacy"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-gold-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-2"
        >
          <div className="p-3 rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 w-fit">
            <Pill className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display group-hover:text-gold-300">
            Pharmacy Dispensary
          </h4>
          <p className="text-xs text-slate-400 font-light">
            Check in-stock skincare bottles, post-laser balms, and log patient dispensed items.
          </p>
        </Link>
      </div>
    </div>
  );
}
