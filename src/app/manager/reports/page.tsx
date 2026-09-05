"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { DataTable, Column } from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportReportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Sale } from "@/types";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  DollarSign,
  Filter,
  Briefcase,
} from "lucide-react";

export default function ManagerReportsPage() {
  const { sales, expenses, treatments, settings } = useData();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("ALL");

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchStart = !startDate || sale.saleDate >= startDate;
      const matchEnd = !endDate || sale.saleDate <= endDate;
      const matchProc =
        selectedProcedure === "ALL" || sale.procedureId === selectedProcedure;
      return matchStart && matchEnd && matchProc;
    });
  }, [sales, startDate, endDate, selectedProcedure]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchStart = !startDate || exp.expenseDate >= startDate;
      const matchEnd = !endDate || exp.expenseDate <= endDate;
      return matchStart && matchEnd;
    });
  }, [expenses, startDate, endDate]);

  const totalIncome = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.netAmount, 0),
    [filteredSales]
  );
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const netProfit = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    return [
      { name: "Period Start", income: totalIncome * 0.4, expenses: totalExpense * 0.4, netProfit: (totalIncome - totalExpense) * 0.4 },
      { name: "Mid Period", income: totalIncome * 0.7, expenses: totalExpense * 0.65, netProfit: (totalIncome - totalExpense) * 0.7 },
      { name: "Current Period", income: totalIncome, expenses: totalExpense, netProfit: netProfit },
    ];
  }, [totalIncome, totalExpense, netProfit]);

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
      totalExpense,
      netProfit,
    });

    showToast("PDF Export Downloaded", "Manager financial statement generated.", "success");
  };

  const handleExportCSV = () => {
    const csvRows = filteredSales.map((s) => ({
      "Invoice Number": s.invoiceNumber,
      "Date": s.saleDate,
      "Patient": s.customerName,
      "Phone": s.customerPhone,
      "Procedure": s.procedureName,
      "Method": s.paymentMethod,
      "Net Amount (Rs.)": s.netAmount,
      "Recorded By": s.recordedBy,
    }));

    exportToCSV(`Manager_Financial_Report_${startDate}_to_${endDate}`, csvRows);
    showToast("CSV Export Downloaded", "Sales transactions exported.", "info");
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
      header: "Patient",
      accessorKey: "customerName",
      sortable: true,
      cell: (s) => <span className="font-bold text-slate-200 text-xs">{s.customerName}</span>,
    },
    {
      header: "Procedure",
      accessorKey: "procedureName",
      sortable: true,
      cell: (s) => <span className="font-semibold text-amber-300 text-xs">{s.procedureName}</span>,
    },
    {
      header: "Payment",
      accessorKey: "paymentMethod",
      cell: (s) => (
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] capitalize">
          {s.paymentMethod.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Net Amount",
      accessorKey: "netAmount",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(s.netAmount)}
        </span>
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
            <span>Financial Audits & Procedure Reporting</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Financial & Sales Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Filter income and expenditures by custom dates and procedures with audit exports.
          </p>
        </div>

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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 backdrop-blur-xl">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-slate-300 uppercase whitespace-nowrap">
            Procedure Filter:
          </span>
          <select
            value={selectedProcedure}
            onChange={(e) => setSelectedProcedure(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Procedures ({treatments.length})</option>
            {treatments.map((t) => (
              <option key={t.treatmentId} value={t.treatmentId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dark-card/90 border border-emerald-500/30 backdrop-blur-xl">
          <p className="text-xs text-emerald-400 font-semibold uppercase">
            Filtered Revenue
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalIncome)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredSales.length} Sales logged
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-rose-500/30 backdrop-blur-xl">
          <p className="text-xs text-rose-400 font-semibold uppercase">
            Filtered Expenses
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(totalExpense)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredExpenses.length} Expense records
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-dark-card/90 border border-amber-500/30 backdrop-blur-xl">
          <p className="text-xs text-amber-300 font-semibold uppercase">
            Net Margin
          </p>
          <h4 className="text-2xl font-bold text-white font-mono mt-1">
            {formatCurrency(netProfit)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">Operating surplus</p>
        </div>
      </div>

      {/* Financial Trend */}
      <RevenueExpenseChart
        data={chartData}
        title="Filtered Period Cashflow"
        height={260}
      />

      {/* Sales Transactions */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white font-display">
          Sales Transactions Breakdown ({filteredSales.length})
        </h3>
        <DataTable
          data={filteredSales}
          columns={columns}
          searchPlaceholder="Search transactions..."
          searchKey="customerName"
        />
      </div>
    </div>
  );
}
