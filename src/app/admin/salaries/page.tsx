"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { SalaryRecord, SalaryStatus } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportPayslipToPDF } from "@/lib/exportUtils";
import {
  CreditCard,
  Sparkles,
  Calculator,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";

export default function AdminSalariesPage() {
  const { user } = useAuth();
  const {
    salaries,
    employees,
    settings,
    generateMonthlySalaries,
    updateSalaryStatus,
  } = useData();
  const { showToast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");

  // Filter salaries by selected month
  const monthSalaries = useMemo(() => {
    return salaries.filter((s) => s.month === selectedMonth);
  }, [salaries, selectedMonth]);

  const totalPayroll = useMemo(
    () => monthSalaries.reduce((sum, s) => sum + s.netPay, 0),
    [monthSalaries]
  );
  const paidCount = monthSalaries.filter((s) => s.status === "paid").length;
  const pendingCount = monthSalaries.filter((s) => s.status !== "paid").length;

  const handleGeneratePayroll = () => {
    generateMonthlySalaries(selectedMonth, user?.displayName || "Sheraz khan");
    showToast(
      "Monthly Payroll Computed",
      `Payroll for ${selectedMonth} calculated across ${employees.length} staff based on attendance records.`,
      "success"
    );
  };

  const handleMarkPaid = (salaryId: string, empName: string) => {
    updateSalaryStatus(salaryId, "paid");
    showToast(
      "Salary Disbursed",
      `Payout for ${empName} has been marked as PAID.`,
      "success"
    );
  };

  const handleDownloadPayslip = (salary: SalaryRecord) => {
    exportPayslipToPDF(salary, settings.clinicName);
    showToast(
      "Payslip PDF Downloaded",
      `Saved official payslip for ${salary.employeeName}.`,
      "info"
    );
  };

  const columns: Column<SalaryRecord>[] = [
    {
      header: "Staff Member",
      accessorKey: "employeeName",
      sortable: true,
      cell: (sal) => (
        <div>
          <p className="font-bold text-white text-xs">{sal.employeeName}</p>
          <p className="text-[11px] text-clinic-300">{sal.designation}</p>
          <p className="text-[10px] text-slate-400 font-mono">Ref: {sal.payslipNumber}</p>
        </div>
      ),
    },
    {
      header: "Base Salary",
      accessorKey: "baseSalary",
      sortable: true,
      cell: (sal) => (
        <span className="font-mono text-slate-200 text-xs font-semibold">
          {formatCurrency(sal.baseSalary)}
        </span>
      ),
    },
    {
      header: "Attendance Logs",
      cell: (sal) => (
        <div className="text-xs text-slate-300">
          <p>
            <span className="text-emerald-400 font-semibold">{sal.presentDays}</span> /{" "}
            {sal.workingDays} working days
          </p>
          {sal.absentDays > 0 ? (
            <p className="text-[11px] text-rose-400">
              {sal.absentDays} unexcused {sal.absentDays === 1 ? "absence" : "absences"}
            </p>
          ) : (
            <p className="text-[10px] text-emerald-400">100% Perfect Attendance</p>
          )}
        </div>
      ),
    },
    {
      header: "Deductions",
      accessorKey: "deductions",
      cell: (sal) => (
        <span className="font-mono text-xs text-rose-400">
          {sal.deductions > 0 ? `-${formatCurrency(sal.deductions)}` : formatCurrency(0)}
        </span>
      ),
    },
    {
      header: "Bonus / Incentive",
      accessorKey: "bonus",
      cell: (sal) => (
        <span className="font-mono text-xs text-emerald-400">
          {sal.bonus > 0 ? `+${formatCurrency(sal.bonus)}` : formatCurrency(0)}
        </span>
      ),
    },
    {
      header: "Net Pay",
      accessorKey: "netPay",
      sortable: true,
      cell: (sal) => (
        <span className="font-mono font-bold text-sm text-emerald-400">
          {formatCurrency(sal.netPay)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (sal) => <StatusBadge status={sal.status} />,
    },
    {
      header: "Actions",
      cell: (sal) => (
        <div className="flex items-center gap-2">
          {sal.status !== "paid" && (
            <button
              onClick={() => handleMarkPaid(sal.salaryId, sal.employeeName)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all"
            >
              Mark Paid
            </button>
          )}
          <button
            onClick={() => handleDownloadPayslip(sal)}
            title="Download PDF Payslip"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
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
            <CreditCard className="w-4 h-4" />
            <span>Payroll & Attendance Deduction Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Staff Salaries & Payslips
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Automated wage computation linking daily attendance, penalties, and official PDF payslips.
          </p>
        </div>

        <button
          onClick={handleGeneratePayroll}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
        >
          <Calculator className="w-4 h-4" />
          <span>Compute Payroll for {selectedMonth}</span>
        </button>
      </div>

      {/* Month Filter & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">
              Select Pay Period:
            </p>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>
          <Calendar className="w-6 h-6 text-clinic-400 opacity-60" />
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Total Month Payroll
            </p>
            <h4 className="text-xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalPayroll)}
            </h4>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              Paid Out
            </p>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">
              {paidCount} / {monthSalaries.length} Staff
            </h4>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-amber-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Pending Payouts
            </p>
            <h4 className="text-xl font-bold text-amber-400 mt-1">
              {pendingCount} Staff
            </h4>
          </div>
          <CreditCard className="w-6 h-6 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Salary Calculation Info Callout */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-clinic-500/30 flex items-start gap-3 text-xs text-slate-300">
        <Sparkles className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">
            Automated Absence Deduction Formula Active
          </p>
          <p className="text-slate-400 mt-0.5">
            Formula:{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-clinic-300 font-mono">
              Net Pay = Base Salary - (Daily Wage × Unexcused Absences) + Performance Bonus
            </code>
            . Daily wage is calculated at (Base Salary ÷ 26 standard monthly working days).
          </p>
        </div>
      </div>

      {/* Salary Table */}
      <DataTable
        data={monthSalaries}
        columns={columns}
        searchPlaceholder="Search payslips by employee name, designation, or ID..."
        searchKey="employeeName"
        emptyMessage={`No payroll generated yet for ${selectedMonth}. Click "Compute Payroll" above.`}
      />
    </div>
  );
}
