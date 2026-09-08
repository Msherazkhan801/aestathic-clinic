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
  Briefcase,
  Printer,
  QrCode,
} from "lucide-react";

export default function ManagerAttendancePage() {
  const { employees, attendance, markAttendance, settings } = useData();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Form State
  const [targetEmpId, setTargetEmpId] = useState(employees[0]?.employeeId || "");
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>("present");
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:30");
  const [remarks, setRemarks] = useState("");

  const todayAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const leaveCount = todayAttendance.filter(
    (a) => a.status === "leave" || a.status === "half-day"
  ).length;

  const filteredRecords = useMemo(() => {
    return attendance.filter((a) => {
      const matchDate = !selectedDate || a.date === selectedDate;
      const matchEmp =
        selectedEmployeeFilter === "ALL" || a.employeeId === selectedEmployeeFilter;
      return matchDate && matchEmp;
    });
  }, [attendance, selectedDate, selectedEmployeeFilter]);

  const handleQuickStatus = (empId: string, status: AttendanceStatus) => {
    markAttendance(empId, status, selectedDate);
    const emp = employees.find((e) => e.employeeId === empId);
    showToast(
      "Attendance Marked",
      `${emp?.name} marked as ${status.toUpperCase()}.`,
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
    showToast("Attendance Saved", "Custom entry logged.", "success");
    setIsModalOpen(false);
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Staff Member",
      accessorKey: "employeeName",
      sortable: true,
      cell: (rec) => (
        <div>
          <p className="font-bold text-white text-xs">{rec.employeeName}</p>
          <p className="text-[11px] text-slate-400">ID: {rec.employeeId}</p>
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
      header: "Remarks",
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
            onClick={() => handleQuickStatus(rec.employeeId, "present")}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              rec.status === "present"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Present
          </button>
          <button
            onClick={() => handleQuickStatus(rec.employeeId, "absent")}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              rec.status === "absent"
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Absent
          </button>
          <button
            onClick={() => handleQuickStatus(rec.employeeId, "leave")}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
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
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Manager HR Operations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Mark Staff Daily Attendance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            1-Click staff attendance marking directly tied to monthly payroll calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold shadow-md transition-all"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Staff QR Badges & Print</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Log</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Target Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <User className="w-4 h-4 text-clinic-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Filter Staff:
            </span>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase">
              Present Today
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{presentCount} Staff</h4>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-300 font-semibold uppercase">
              Unexcused Absences
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{absentCount} Staff</h4>
          </div>
          <XCircle className="w-8 h-8 text-rose-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-300 font-semibold uppercase">
              Leaves / Half-Days
            </p>
            <h4 className="text-2xl font-bold text-white mt-1">{leaveCount} Staff</h4>
          </div>
          <Clock className="w-8 h-8 text-purple-400 opacity-80" />
        </div>
      </div>

      {/* 1-Click Roster Cards */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
        <div>
          <h3 className="text-base font-bold text-white font-display">
            Fast Attendance Roster ({formatDate(selectedDate)})
          </h3>
          <p className="text-xs text-slate-400">
            Click status button to instantly toggle and update daily presence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const record = todayAttendance.find((a) => a.employeeId === emp.employeeId);
            const currentStatus = record ? record.status : "present";

            return (
              <div
                key={emp.employeeId}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/70 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{emp.name}</p>
                    <p className="text-[11px] text-amber-300">{emp.designation}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Shift: {emp.shiftStart} - {emp.shiftEnd}
                    </p>
                  </div>
                  <StatusBadge status={currentStatus} />
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleQuickStatus(emp.employeeId, "present")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "present"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleQuickStatus(emp.employeeId, "absent")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "absent"
                        ? "bg-rose-500 text-white font-bold shadow-md"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => handleQuickStatus(emp.employeeId, "leave")}
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
        searchPlaceholder="Search attendance records..."
        searchKey="employeeName"
      />

      {/* Custom Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Detailed Attendance Entry"
        subtitle="Specify exact timestamps and justification"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Staff Member
            </label>
            <select
              value={targetEmpId}
              onChange={(e) => setTargetEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved medical leave or emergency late arrival"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold shadow-lg transition-all"
            >
              Save Record
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
