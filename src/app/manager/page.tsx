"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DollarSign,
  TrendingUp,
  Users,
  CalendarCheck,
  CreditCard,
  Briefcase,
  ArrowRight,
  Plus,
  Clock,
  Receipt,
  FileBarChart,
} from "lucide-react";

export default function ManagerOverviewPage() {
  const { sales, expenses, employees, attendance, appointments } = useData();

  const totalIncome = useMemo(
    () => sales.reduce((sum, s) => sum + s.netAmount, 0),
    [sales]
  );
  const totalExpense = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const netProfit = totalIncome - totalExpense;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = useMemo(
    () => attendance.filter((a) => a.date === todayStr),
    [attendance, todayStr]
  );
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;

  const chartData = useMemo(() => {
    return [
      { name: "Apr", income: 24500, expenses: 14200, netProfit: 10300 },
      { name: "May", income: 28900, expenses: 16100, netProfit: 12800 },
      { name: "Jun", income: 32400, expenses: 17800, netProfit: 14600 },
      { name: "Jul", income: 34100, expenses: 18500, netProfit: 15600 },
      { name: "Aug", income: 38200, expenses: 19400, netProfit: 18800 },
      {
        name: "Sep (Current)",
        income: totalIncome > 0 ? totalIncome : 41500,
        expenses: totalExpense > 0 ? totalExpense : 20200,
        netProfit: (totalIncome > 0 ? totalIncome : 41500) - (totalExpense > 0 ? totalExpense : 20200),
      },
    ];
  }, [totalIncome, totalExpense]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-dark-card to-slate-900 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-glass-dark">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Briefcase className="w-4 h-4" />
              <span>HR & Financial Management Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Welcome, Alexander Wright
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
              Mark daily attendance, calculate absence-adjusted staff salaries, and record clinic finances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/manager/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Today&apos;s Attendance</span>
            </Link>
            <Link
              href="/manager/finance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Record Sale / Expense</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Staff Present Today"
          value={`${presentCount} / ${employees.length}`}
          subtitle="Attendance logging active"
          icon={CalendarCheck}
          variant="gold"
        />
        <StatCard
          title="Period Sales Revenue"
          value={formatCurrency(totalIncome)}
          change={12.4}
          changeLabel="vs last month"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Recorded Expenses"
          value={formatCurrency(totalExpense)}
          change={-4.1}
          changeLabel="operating expenses"
          icon={CreditCard}
          variant="rose"
        />
        <StatCard
          title="Net Cashflow"
          value={formatCurrency(netProfit)}
          change={16.2}
          changeLabel="operating margin"
          icon={TrendingUp}
          variant="slate"
        />
      </div>

      {/* Financial Chart */}
      <div>
        <RevenueExpenseChart
          data={chartData}
          title="Clinic Income vs Operating Costs Trend"
          height={300}
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <Link
          href="/manager/attendance"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-amber-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-3"
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display group-hover:text-amber-300 transition-colors">
            Staff Daily Attendance
          </h3>
          <p className="text-xs text-slate-400 font-light">
            Record check-in/out timestamps and unexcused absences for accurate payroll linkage.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 pt-2">
            <span>Mark Attendance</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Salaries Card */}
        <Link
          href="/manager/salaries"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-emerald-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-3"
        >
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-300 transition-colors">
            Automated Salary Engine
          </h3>
          <p className="text-xs text-slate-400 font-light">
            Compute payroll with automatic daily wage deductions for absences and generate payslips.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 pt-2">
            <span>Calculate Payroll</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Reports Card */}
        <Link
          href="/manager/reports"
          className="group p-6 rounded-3xl bg-dark-card/90 border border-slate-700/80 hover:border-clinic-500/50 backdrop-blur-xl transition-all shadow-glass-dark hover:-translate-y-1 space-y-3"
        >
          <div className="p-3 rounded-2xl bg-clinic-500/10 text-clinic-400 border border-clinic-500/20 w-fit">
            <FileBarChart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display group-hover:text-clinic-300 transition-colors">
            Filtered Financial Reports
          </h3>
          <p className="text-xs text-slate-400 font-light">
            Generate custom date range reports by procedure and download audit-ready PDFs or CSVs.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-clinic-400 pt-2">
            <span>View Reports</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Staff Duty Schedule Today */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Staff Shift Timings & Attendance ({formatDate(todayStr)})
            </h3>
            <p className="text-xs text-slate-400">
              Shift coverage and status for scheduled clinic physicians & staff
            </p>
          </div>
          <Link
            href="/manager/employees"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Manage Shifts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const att = todayAttendance.find((a) => a.employeeId === emp.employeeId);
            const status = att ? att.status : "present";

            return (
              <div
                key={emp.employeeId}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white text-xs">{emp.name}</p>
                  <p className="text-[11px] text-slate-400">{emp.designation}</p>
                  <div className="flex items-center gap-1 text-[10px] text-clinic-300 font-mono mt-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {emp.shiftStart} - {emp.shiftEnd}
                    </span>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
