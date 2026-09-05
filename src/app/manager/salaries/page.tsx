"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { SalaryRecord } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { exportPayslipToPDF } from "@/lib/exportUtils";
import {
  CreditCard,
  Calculator,
  Download,
  Calendar,
  DollarSign,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

export default function ManagerSalariesPage() {
  const {
    salaries,
    employees,
    settings,
    generateMonthlySalaries,
    updateSalaryStatus,
  } = useData();
  const { showToast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");

  const monthSalaries = useMemo(() => {
    return salaries.filter((s) => s.month === selectedMonth);
  }, [salaries, selectedMonth]);

  const totalPayroll = useMemo(
    () => monthSalaries.reduce((sum, s) => sum + s.netPay, 0),
    [monthSalaries]
  );
  const paidCount = monthSalaries.filter((s) => s.status === "paid").length;

  const handleCompute = () => {
    generateMonthlySalaries(selectedMonth, "Alexander Wright");
    showToast(
      "Salaries Computed",
      `Payroll for ${selectedMonth} computed linking absences and base salaries.`,
      "success"
    );
  };

  const handleMarkPaid = (salaryId: string, name: string) => {
    updateSalaryStatus(salaryId, "paid");
    showToast("Payout Recorded", `Marked salary for ${name} as PAID.`, "success");
  };

  const handleDownload = (sal: SalaryRecord) => {
    exportPayslipToPDF(sal, settings.clinicName);
    showToast("Payslip Downloaded", `Saved payslip for ${sal.employeeName}.`, "info");
  };

  const columns: Column<SalaryRecord>[] = [
    {
      header: "Staff Member",
      accessorKey: "employeeName",
      sortable: true,
      cell: (s) => (
        <div>
          <p className="font-bold text-white text-xs">{s.employeeName}</p>
          <p className="text-[11px] text-amber-300">{s.designation}</p>
          <p className="text-[10px] text-slate-400 font-mono">Ref: {s.payslipNumber}</p>
        </div>
      ),
    },
    {
      header: "Base Salary",
      accessorKey: "baseSalary",
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-slate-200 text-xs font-semibold">
          {formatCurrency(s.baseSalary)}
        </span>
      ),
    },
    {
      header: "Days Worked / Absent",
      cell: (s) => (
        <div className="text-xs">
          <p>
            <span className="text-emerald-400 font-semibold">{s.presentDays}</span> /{" "}
            {s.workingDays} days
          </p>
          {s.absentDays > 0 && (
            <p className="text-[11px] text-rose-400 font-medium">
              -{s.absentDays} unexcused absence
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Deductions",
      accessorKey: "deductions",
      cell: (s) => (
        <span className="font-mono text-xs text-rose-400">
          {s.deductions > 0 ? `-${formatCurrency(s.deductions)}` : formatCurrency(0)}
        </span>
      ),
    },
    {
      header: "Net Pay",
      accessorKey: "netPay",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-sm text-emerald-400">
          {formatCurrency(s.netPay)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex items-center gap-2">
          {s.status !== "paid" && (
            <button
              onClick={() => handleMarkPaid(s.salaryId, s.employeeName)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all"
            >
              Mark Paid
            </button>
          )}
          <button
            onClick={() => handleDownload(s)}
            title="Download PDF Payslip"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
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
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Payroll Computation & Disbursement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Staff Salaries & Calculations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Automatic absence penalty deductions based on daily attendance records.
          </p>
        </div>

        <button
          onClick={handleCompute}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <Calculator className="w-4 h-4" />
          <span>Compute Salaries for {selectedMonth}</span>
        </button>
      </div>

      {/* Filter & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">
              Select Month:
            </p>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <Calendar className="w-6 h-6 text-amber-400 opacity-70" />
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase">
              Total Month Payroll
            </p>
            <h4 className="text-xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalPayroll)}
            </h4>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-semibold uppercase">
              Disbursed Payouts
            </p>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">
              {paidCount} / {monthSalaries.length} Staff
            </h4>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>
      </div>

      <DataTable
        data={monthSalaries}
        columns={columns}
        searchPlaceholder="Search salary records..."
        searchKey="employeeName"
        emptyMessage={`No salary records computed yet for ${selectedMonth}. Click "Compute Salaries" above.`}
      />
    </div>
  );
}
