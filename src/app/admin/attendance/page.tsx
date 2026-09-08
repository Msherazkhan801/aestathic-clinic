"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { AttendanceRecord, AttendanceStatus } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { BulkQrPrintModal } from "@/components/attendance/BulkQrPrintModal";
import { formatDate } from "@/lib/utils";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  QrCode,
  Printer,
} from "lucide-react";

export default function AdminAttendancePage() {
  const { employees, attendance, markAttendance, settings } = useData();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Manual record form
  const [targetEmpId, setTargetEmpId] = useState(employees[0]?.employeeId || "");
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>("present");
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:30");
  const [remarks, setRemarks] = useState("");

  // Attendance metrics
  const todayAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const leaveCount = todayAttendance.filter((a) => a.status === "leave" || a.status === "half-day").length;

  // Filtered attendance list
  const filteredRecords = useMemo(() => {
    return attendance.filter((a) => {
      const matchDate = !selectedDate || a.date === selectedDate;
      const matchEmp =
        selectedEmployeeFilter === "ALL" || a.employeeId === selectedEmployeeFilter;
      return matchDate && matchEmp;
    });
  }, [attendance, selectedDate, selectedEmployeeFilter]);

  const handleQuickStatusChange = (
    empId: string,
    status: AttendanceStatus
  ) => {
    markAttendance(empId, status, selectedDate);
    const emp = employees.find((e) => e.employeeId === empId);
    showToast(
      "Attendance Updated",
      `${emp?.name} marked as ${status.toUpperCase()} for ${formatDate(selectedDate)}.`,
      "success"
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markAttendance(
      targetEmpId,
      targetStatus,
      selectedDate,
      checkInTime,
      checkOutTime,
      remarks
    );
    const emp = employees.find((e) => e.employeeId === targetEmpId);
    showToast(
      "Attendance Recorded",
      `Saved status for ${emp?.name}.`,
      "success"
    );
    setIsModalOpen(false);
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Staff Member",
      accessorKey: "employeeName",
      sortable: true,
      cell: (rec) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-clinic-300">
            {rec.employeeName.replace("Dr. ", "").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white text-xs">{rec.employeeName}</p>
            <p className="text-[10px] text-slate-400">ID: {rec.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      sortable: true,
      cell: (rec) => formatDate(rec.date),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (rec) => <StatusBadge status={rec.status} />,
    },
    {
      header: "Check-In / Out",
      accessorKey: "checkIn",
      cell: (rec) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-clinic-400" />
          <span>
            {rec.checkIn || "—"} - {rec.checkOut || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Remarks / Notes",
      accessorKey: "remarks",
      cell: (rec) => (
        <span className="text-xs text-slate-400 italic">
          {rec.remarks || "Regular shift duty"}
        </span>
      ),
    },
    {
      header: "Mark Status",
      cell: (rec) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleQuickStatusChange(rec.employeeId, "present")}
            title="Mark Present"
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              rec.status === "present"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Present
          </button>
          <button
            onClick={() => handleQuickStatusChange(rec.employeeId, "absent")}
            title="Mark Absent"
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              rec.status === "absent"
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Absent
          </button>
          <button
            onClick={() => handleQuickStatusChange(rec.employeeId, "leave")}
            title="Mark Leave"
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              rec.status === "leave"
                ? "bg-purple-500/20 border-purple-500 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Leave
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance & Shift Tracking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Staff Daily Attendance Sheet
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Real-time daily presence logging, check-in timestamps, and automated salary linkage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold shadow-md transition-all"
          >
            <Printer className="w-4 h-4 text-clinic-400" />
            <span>Staff QR Badges & Print</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Custom Entry</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <Calendar className="w-4 h-4 text-clinic-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Target Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <User className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Filter Staff:
            </span>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-clinic-500 focus:outline-none"
            >
              <option value="ALL">All Staff Members ({employees.length})</option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Present Today
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{presentCount} Staff</h4>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
              Unexcused Absences
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{absentCount} Staff</h4>
          </div>
          <XCircle className="w-8 h-8 text-rose-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Leaves & Half-Days
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{leaveCount} Staff</h4>
          </div>
          <Clock className="w-8 h-8 text-purple-400 opacity-80" />
        </div>
      </div>

      {/* Roster & Quick Action Sheet */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Daily Attendance Roster ({formatDate(selectedDate)})
            </h3>
            <p className="text-xs text-slate-400">
              One-click presence toggle updates logs and syncs with monthly payroll
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const record = todayAttendance.find((a) => a.employeeId === emp.employeeId);
            const currentStatus = record ? record.status : "present";

            return (
              <div
                key={emp.employeeId}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{emp.name}</p>
                    <p className="text-[11px] text-clinic-300">{emp.designation}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Shift: {emp.shiftStart} - {emp.shiftEnd}
                    </p>
                  </div>
                  <StatusBadge status={currentStatus} />
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleQuickStatusChange(emp.employeeId, "present")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "present"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(emp.employeeId, "absent")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "absent"
                        ? "bg-rose-500 text-white font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(emp.employeeId, "leave")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "leave"
                        ? "bg-purple-500 text-white font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Leave
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History Table */}
      <DataTable
        data={filteredRecords}
        columns={columns}
        searchPlaceholder="Search attendance records by employee name or remarks..."
        searchKey="employeeName"
      />

      {/* Record Custom Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Custom Attendance Entry"
        subtitle="Log precise check-in/out timestamps and notes"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Staff Member
            </label>
            <select
              value={targetEmpId}
              onChange={(e) => setTargetEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            >
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name} — {e.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="absent">Absent (Unexcused)</option>
                <option value="leave">Approved Leave</option>
                <option value="half-day">Half-Day</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Check-In Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Check-Out Time
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Remarks / Justification
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved medical leave or emergency late arrival"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold shadow-glow transition-all"
            >
              Save Attendance Log
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk QR Print Modal */}
      <BulkQrPrintModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        employees={employees}
        clinicName={settings.clinicName || "SHEZI AESTHETICS"}
      />
    </div>
  );
}
