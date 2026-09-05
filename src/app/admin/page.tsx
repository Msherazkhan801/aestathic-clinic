"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { ProcedureBreakdownChart } from "@/components/charts/ProcedureBreakdownChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoicePreview } from "@/components/ui/InvoicePreview";
import { Sale } from "@/types";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Pill,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function AdminOverviewPage() {
  const {
    sales,
    expenses,
    employees,
    appointments,
    pharmacy,
    settings,
    treatments,
    contacts,
  } = useData();

  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<Sale | null>(null);

  // Financial calculations
  const totalRevenue = useMemo(
    () => sales.reduce((sum, s) => sum + s.netAmount, 0),
    [sales]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const netProfit = totalRevenue - totalExpenses;
  const lowStockItems = useMemo(
    () => pharmacy.filter((p) => p.quantity <= p.minThreshold),
    [pharmacy]
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.appointmentDate === todayStr),
    [appointments, todayStr]
  );

  // Prepare monthly chart data
  const chartData = useMemo(() => {
    // Build last 6 months trend
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    return [
      { name: "Apr", income: 24500, expenses: 14200, netProfit: 10300 },
      { name: "May", income: 28900, expenses: 16100, netProfit: 12800 },
      { name: "Jun", income: 32400, expenses: 17800, netProfit: 14600 },
      { name: "Jul", income: 34100, expenses: 18500, netProfit: 15600 },
      { name: "Aug", income: 38200, expenses: 19400, netProfit: 18800 },
      {
        name: "Sep (Current)",
        income: totalRevenue > 0 ? totalRevenue : 41500,
        expenses: totalExpenses > 0 ? totalExpenses : 20200,
        netProfit: (totalRevenue > 0 ? totalRevenue : 41500) - (totalExpenses > 0 ? totalExpenses : 20200),
      },
    ];
  }, [totalRevenue, totalExpenses]);

  // Prepare procedure breakdown data
  const procedureChartData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      map[s.procedureName] = (map[s.procedureName] || 0) + s.netAmount;
    });

    const result = Object.entries(map).map(([name, value]) => ({
      name: name.length > 22 ? `${name.slice(0, 20)}...` : name,
      value,
    }));

    if (result.length === 0) {
      return [
        { name: "Injectables & Fillers", value: 18400 },
        { name: "Facials & Peels", value: 9200 },
        { name: "Laser & Skin Tightening", value: 12800 },
      ];
    }
    return result;
  }, [sales]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-dark-card to-slate-900 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-glass-dark">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-clinic-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-clinic-300 text-xs font-bold uppercase tracking-widest mb-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Executive Clinical Directorate</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Welcome back, Dr. Elena Vance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
              High-level clinic performance metrics, cashflow, patient flow, and staff operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white text-xs font-bold shadow-glow transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Audit Report</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Income (Period)"
          value={formatCurrency(totalRevenue)}
          change={14.8}
          changeLabel="vs last period"
          icon={DollarSign}
          variant="rose"
        />
        <StatCard
          title="Clinic Expenses"
          value={formatCurrency(totalExpenses)}
          change={-3.2}
          changeLabel="overhead reduction"
          icon={CreditCard}
          variant="gold"
        />
        <StatCard
          title="Net Operating Margin"
          value={formatCurrency(netProfit)}
          change={18.4}
          changeLabel="net profit ratio"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Active Staff & Doctors"
          value={employees.filter((e) => e.isActive).length}
          subtitle="6 on duty today"
          icon={Users}
          variant="slate"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={chartData} height={320} />
        </div>
        <div>
          <ProcedureBreakdownChart data={procedureChartData} height={320} />
        </div>
      </div>

      {/* Secondary Data Grids: Today's Appointments & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments Schedule */}
        <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-clinic-400" />
              <h3 className="text-base font-bold text-white font-display">
                Today&apos;s Appointments
              </h3>
            </div>
            <Link
              href="/admin/appointments"
              className="text-xs font-semibold text-clinic-400 hover:text-clinic-300 flex items-center gap-1"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 4).map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-clinic-400" />
                      {apt.appointmentTime}
                    </div>
                    <div>
                      <p className="font-bold text-white">{apt.customerName}</p>
                      <p className="text-slate-400 text-[11px]">
                        {apt.procedureName} • With {apt.employeeName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No appointments scheduled for today.
              </p>
            )}
          </div>
        </div>

        {/* Low Stock & Pharmacy Alerts */}
        <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Pill className="w-5 h-5 text-gold-400" />
              <h3 className="text-base font-bold text-white font-display">
                Inventory & Stock Alerts
              </h3>
            </div>
            <Link
              href="/admin/pharmacy"
              className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.itemId}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-slate-400 text-[11px]">
                      Batch: {item.batchNumber} • Exp: {formatDate(item.expiryDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                      {item.quantity} {item.unit} remaining
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Threshold: {item.minThreshold}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>All cosmetic supplies & pharmaceuticals are adequately stocked.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Income / Sales Transactions */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Recent Income & Procedure Sales
            </h3>
            <p className="text-xs text-slate-400">
              Live cashier transactions linked directly to clinical procedures
            </p>
          </div>
          <Link
            href="/admin/finance"
            className="text-xs font-semibold text-clinic-400 hover:text-clinic-300 flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-700 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Procedure</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Net Amount</th>
                <th className="px-4 py-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.saleId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-white">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">{formatDate(sale.saleDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {sale.customerName}
                  </td>
                  <td className="px-4 py-3 text-clinic-300 font-medium">
                    {sale.procedureName}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {sale.paymentMethod.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">
                    {formatCurrency(sale.netAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedSaleForInvoice(sale)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold transition-colors"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoicePreview
        isOpen={Boolean(selectedSaleForInvoice)}
        onClose={() => setSelectedSaleForInvoice(null)}
        sale={selectedSaleForInvoice}
        settings={settings}
      />
    </div>
  );
}
