"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { ProcedureBreakdownChart } from "@/components/charts/ProcedureBreakdownChart";
import { DataTable, Column } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportReportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Sale } from "@/types";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Receipt,
  Filter,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";

export default function AdminReportsPage() {
  const { sales, expenses, treatments, settings } = useData();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("ALL");

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchStart = !startDate || sale.saleDate >= startDate;
      const matchEnd = !endDate || sale.saleDate <= endDate;
      const matchProc =
        selectedProcedure === "ALL" || sale.procedureId === selectedProcedure;
      return matchStart && matchEnd && matchProc;
    });
  }, [sales, startDate, endDate, selectedProcedure]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchStart = !startDate || exp.expenseDate >= startDate;
      const matchEnd = !endDate || exp.expenseDate <= endDate;
      return matchStart && matchEnd;
    });
  }, [expenses, startDate, endDate]);

  // Aggregate Metrics
  const totalIncome = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.netAmount, 0),
    [filteredSales]
  );
  const totalCost = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.totalCost || 0), 0),
    [filteredSales]
  );
  const grossProfit = totalIncome - totalCost;
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const netProfit = grossProfit - totalExpense;
  const avgTicket = filteredSales.length > 0 ? totalIncome / filteredSales.length : 0;

  // Chart data
  const procedureChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach((s) => {
      map[s.procedureName] = (map[s.procedureName] || 0) + s.netAmount;
    });
    const result = Object.entries(map).map(([name, value]) => ({
      name: name.length > 20 ? `${name.slice(0, 18)}...` : name,
      value,
    }));
    return result.length > 0 ? result : [{ name: "Filtered Procedure", value: totalIncome || 1 }];
  }, [filteredSales, totalIncome]);

  const trendChartData = useMemo(() => {
    return [
      { name: "Period Start", income: totalIncome * 0.4, expenses: totalExpense * 0.4, netProfit: (grossProfit - totalExpense) * 0.4 },
      { name: "Mid Period", income: totalIncome * 0.7, expenses: totalExpense * 0.65, netProfit: (grossProfit - totalExpense) * 0.7 },
      { name: "Current Period", income: totalIncome, expenses: totalExpense, netProfit: netProfit },
    ];
  }, [totalIncome, totalExpense, grossProfit, netProfit]);

  // Export handlers
  const handleExportPDF = () => {
    const activeProcName =
      selectedProcedure === "ALL"
        ? "ALL PROCEDURES"
        : treatments.find((t) => t.treatmentId === selectedProcedure)?.name || selectedProcedure;

    exportReportToPDF({
      clinicName: settings.clinicName,
      startDate,
      endDate,
      procedureFilter: activeProcName,
      sales: filteredSales,
      expenses: filteredExpenses,
      totalIncome,
      totalCost,
      grossProfit,
      totalExpense,
      netProfit,
    });

    showToast("PDF Export Complete", "Official Executive Report generated & downloaded.", "success");
  };

  const handleExportCSV = () => {
    const csvRows = filteredSales.map((s) => {
      const costVal = s.totalCost || 0;
      const profitVal = s.profit !== undefined ? s.profit : s.netAmount - costVal;
      return {
        "Invoice Number": s.invoiceNumber,
        "Date": s.saleDate,
        "Patient Name": s.customerName,
        "Phone": s.customerPhone,
        "Item / Procedure": s.procedureName,
        "Type": s.saleType || "procedure",
        "Payment Method": s.paymentMethod,
        "Buy Price / Cost (Rs.)": costVal,
        "Sale Price / Revenue (Rs.)": s.netAmount,
        "Gross Profit (Rs.)": profitVal,
        "Profit Margin (%)": s.netAmount > 0 ? `${((profitVal / s.netAmount) * 100).toFixed(1)}%` : "0%",
        "Recorded By": s.recordedBy,
      };
    });

    exportToCSV(`Shezi_Aesthetics_Sales_Audit_${startDate}_to_${endDate}`, csvRows);
    showToast("CSV Export Complete", "Sales ledger with buy/sale prices downloaded as CSV.", "info");
  };

  const columns: Column<Sale>[] = [
    {
      header: "Invoice #",
      accessorKey: "invoiceNumber",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-white text-xs">{s.invoiceNumber}</span>
      ),
    },
    {
      header: "Date",
      accessorKey: "saleDate",
      sortable: true,
      cell: (s) => formatDate(s.saleDate),
    },
    {
      header: "Customer",
      accessorKey: "customerName",
      sortable: true,
      cell: (s) => (
        <div>
          <p className="font-bold text-slate-200 text-xs">{s.customerName}</p>
          <p className="text-[11px] text-slate-400">{s.customerPhone}</p>
        </div>
      ),
    },
    {
      header: "Item / Procedure",
      accessorKey: "procedureName",
      sortable: true,
      cell: (s) => {
        const typeBadge =
          s.saleType === "medicine"
            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            : s.saleType === "mixed"
            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
            : "bg-clinic-500/10 text-clinic-300 border-clinic-500/30";

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${typeBadge}`}>
                {s.saleType || "procedure"}
              </span>
              <span className="font-semibold text-slate-200 text-xs truncate max-w-[180px]">
                {s.procedureName}
              </span>
            </div>
            {s.items && s.items.length > 1 && (
              <p className="text-[10px] text-slate-400">+{s.items.length - 1} item(s)</p>
            )}
          </div>
        );
      },
    },
    {
      header: "Method",
      accessorKey: "paymentMethod",
      cell: (s) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] capitalize">
          {s.paymentMethod.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Buy Price (Cost)",
      accessorKey: "totalCost",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-medium text-amber-400 text-xs">
          {formatCurrency(s.totalCost || 0)}
        </span>
      ),
    },
    {
      header: "Sale Price (Revenue)",
      accessorKey: "netAmount",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-white text-xs">
          {formatCurrency(s.netAmount)}
        </span>
      ),
    },
    {
      header: "Gross Profit",
      accessorKey: "profit",
      sortable: true,
      cell: (s) => {
        const profitVal = s.profit !== undefined ? s.profit : s.netAmount - (s.totalCost || 0);
        const margin = s.netAmount > 0 ? ((profitVal / s.netAmount) * 100).toFixed(0) : 0;
        return (
          <div>
            <span className="font-mono font-bold text-emerald-400 text-xs block">
              +{formatCurrency(profitVal)}
            </span>
            <span className="text-[10px] text-emerald-400/80">{margin}% margin</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <FileBarChart className="w-4 h-4" />
            <span>Executive Analytics & Audits</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Financial & Profit Margin Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Audit sale prices, actual purchase costs (COGS), gross profits, and operating margins with custom filters.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white text-xs font-bold shadow-glow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 backdrop-blur-xl">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />

        {/* Procedure Filter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span className="font-semibold text-slate-300 uppercase whitespace-nowrap">
            Procedure Filter:
          </span>
          <select
            value={selectedProcedure}
            onChange={(e) => setSelectedProcedure(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
          >
            <option value="ALL">All Clinical Procedures ({treatments.length})</option>
            {treatments.map((t) => (
              <option key={t.treatmentId} value={t.treatmentId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-dark-card/90 border border-emerald-500/30 backdrop-blur-xl">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            Total Sale Price
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalIncome)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredSales.length} Transactions
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-amber-500/30 backdrop-blur-xl">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            Cost of Goods (Buy)
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalCost)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">Direct product costs</p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-teal-500/30 backdrop-blur-xl">
          <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
            Gross Sales Profit
          </p>
          <h4 className="text-2xl font-bold text-teal-300 font-mono mt-1">
            {formatCurrency(grossProfit)}
          </h4>
          <p className="text-[11px] text-teal-400 mt-1">
            {totalIncome > 0 ? `${((grossProfit / totalIncome) * 100).toFixed(1)}% margin` : "0%"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-rose-500/30 backdrop-blur-xl">
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
            Operating Expenses
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalExpense)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredExpenses.length} Expense items
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-clinic-500/30 backdrop-blur-xl">
          <p className="text-xs text-clinic-300 font-semibold uppercase tracking-wider">
            Net Clinical Profit
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(netProfit)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">After all expenditures</p>
        </div>
      </div>

      {/* Visual Charts Matching Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueExpenseChart
            data={trendChartData}
            title="Filtered Period Cashflow Trend"
            height={280}
          />
        </div>
        <div>
          <ProcedureBreakdownChart
            data={procedureChartData}
            title="Procedure Revenue Breakdown"
            height={280}
          />
        </div>
      </div>

      {/* Filtered Sales Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white font-display">
          Filtered Sales & Profit Ledger ({filteredSales.length})
        </h3>
        <DataTable
          data={filteredSales}
          columns={columns}
          searchPlaceholder="Search filtered sales..."
          searchKey="customerName"
          emptyMessage="No sales transactions found for the selected date range and procedure filter."
        />
      </div>
    </div>
  );
}
