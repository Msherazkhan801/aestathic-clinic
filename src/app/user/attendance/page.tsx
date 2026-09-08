"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { QrAttendanceScanner } from "@/components/attendance/QrAttendanceScanner";
import { EmployeeQrBadge } from "@/components/attendance/EmployeeQrBadge";
import { BulkQrPrintModal } from "@/components/attendance/BulkQrPrintModal";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AttendanceRecord, AttendanceStatus, Employee } from "@/types";
import { formatTime, formatDate } from "@/lib/utils";
import {
  QrCode,
  CalendarCheck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Printer,
  Search,
  UserCheck,
  ShieldCheck,
  Zap,
  Camera,
} from "lucide-react";

export default function UserAttendancePage() {
  const { employees, attendance, settings } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"scanner" | "today" | "badges">("scanner");
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];

  // Today's attendance records
  const todayRecords = useMemo(() => {
    return attendance.filter((a) => a.date === todayStr);
  }, [attendance, todayStr]);

  // Calculations
  const presentCount = todayRecords.filter((a) => a.status === "present").length;
  const onDutyCount = todayRecords.filter((a) => a.status === "present" && a.checkIn && !a.checkOut).length;
  const checkedOutCount = todayRecords.filter((a) => a.status === "present" && a.checkIn && a.checkOut).length;
  const pendingCount = Math.max(0, employees.length - presentCount);

  // Filtered Today's Table Data
  const filteredTodayRecords = useMemo(() => {
    return todayRecords.filter((rec) => {
      if (selectedStaffFilter === "ALL") return true;
      return rec.employeeId === selectedStaffFilter;
    });
  }, [todayRecords, selectedStaffFilter]);

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Staff Member",
      accessorKey: "employeeName",
      sortable: true,
      cell: (rec) => {
        const emp = employees.find((e) => e.employeeId === rec.employeeId);
        const initials = rec.employeeName.replace("Dr. ", "").slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-clinic-600 to-teal-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <div>
              <p className="font-bold text-white text-xs">{rec.employeeName}</p>
              <p className="text-[11px] text-slate-400 font-light">
                {emp?.designation || "Staff Member"} • {rec.employeeId.toUpperCase()}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (rec) => {
        if (rec.checkIn && !rec.checkOut) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-teal-400 animate-pulse" />
              ON DUTY
            </span>
          );
        }
        if (rec.checkIn && rec.checkOut) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400" />
              SHIFT COMPLETED
            </span>
          );
        }
        return <StatusBadge status={rec.status} />;
      },
    },
    {
      header: "Check-In Time",
      accessorKey: "checkIn",
      sortable: true,
      cell: (rec) => (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>{rec.checkIn ? formatTime(rec.checkIn) : "--:--"}</span>
        </div>
      ),
    },
    {
      header: "Check-Out Time",
      accessorKey: "checkOut",
      sortable: true,
      cell: (rec) => (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{rec.checkOut ? formatTime(rec.checkOut) : "Pending"}</span>
        </div>
      ),
    },
    {
      header: "Marked Method",
      accessorKey: "markedBy",
      cell: (rec) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-clinic-300 border border-slate-700">
          {rec.markedBy || "QR Scanner"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Front Desk Operations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Staff QR Code Attendance & Badges
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Scan clinic employee QR badges for automatic check-in/check-out and manage printable ID cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBulkPrintOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold shadow-md transition-all"
          >
            <Printer className="w-4 h-4 text-clinic-400" />
            <span>Print Staff Badges</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-dark-card border border-slate-700/80 shadow-glass-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff</p>
          <p className="text-2xl font-black text-white font-mono mt-1">{employees.length}</p>
          <p className="text-[11px] text-slate-500 font-light mt-0.5">Registered employees</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card border border-emerald-500/30 bg-emerald-500/5 shadow-glass-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Present Today</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{presentCount}</p>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">Scanned or marked present</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card border border-teal-500/30 bg-teal-500/5 shadow-glass-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-300">Currently On Duty</p>
          <p className="text-2xl font-black text-teal-300 font-mono mt-1">{onDutyCount}</p>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">Checked in, not yet out</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card border border-amber-500/30 bg-amber-500/5 shadow-glass-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending / Absent</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 font-light mt-0.5">Awaiting check-in</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "scanner"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live QR Camera Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab("today")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "today"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Today&apos;s Attendance Log ({todayRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "badges"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Staff QR Badges Directory ({employees.length})</span>
        </button>
      </div>

      {/* Tab 1: Live QR Scanner */}
      {activeTab === "scanner" && (
        <div className="space-y-6">
          <QrAttendanceScanner
            onScanSuccess={(rec, emp) => {
              // Automatically updates through DataContext
            }}
          />
        </div>
      )}

      {/* Tab 2: Today's Attendance Roster & Logs */}
      {activeTab === "today" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
              <span>Today&apos;s Live Attendance Log ({formatDate(todayStr)})</span>
            </h3>

            {/* Filter Dropdown */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none"
            >
              <option value="ALL">All Staff Members</option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name} ({e.employeeId.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <DataTable
            data={filteredTodayRecords}
            columns={columns}
            searchKey="employeeName"
            searchPlaceholder="Search today's attendance logs..."
          />
        </div>
      )}

      {/* Tab 3: Staff QR Badges Gallery */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-card border border-slate-700/80">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-clinic-400" />
                <span>Unique Staff QR ID Cards</span>
              </h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Each employee has a distinct, cryptographic QR attendance code assigned to their ID.
              </p>
            </div>

            <button
              onClick={() => setIsBulkPrintOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Badges (A4 Sheet)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((emp) => (
              <EmployeeQrBadge
                key={emp.employeeId}
                employee={emp}
                clinicName={settings.clinicName || "SHEZI AESTHETICS"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Print Modal */}
      <BulkQrPrintModal
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        employees={employees}
        clinicName={settings.clinicName || "SHEZI AESTHETICS"}
      />
    </div>
  );
}
