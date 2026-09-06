"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Sale, Expense, PaymentMethod, ExpenseCategory } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { InvoicePreview } from "@/components/ui/InvoicePreview";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  CreditCard,
  Receipt,
  FileText,
  Trash2,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "insurance",
  "digital_wallet",
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent & Premises",
  "Medical Supplies & Serums",
  "Salaries & Wages",
  "Marketing & Social Media",
  "Equipment & Maintenance",
  "Utilities & Internet",
  "Office & Refreshments",
  "Other",
];

export default function AdminFinancePage() {
  const { user } = useAuth();
  const {
    sales,
    expenses,
    treatments,
    pharmacy,
    contacts,
    settings,
    addSale,
    deleteSale,
    addExpense,
    deleteExpense,
  } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"income" | "expenses">("income");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<Sale | null>(null);

  // New Sale Form State
  const [saleForm, setSaleForm] = useState({
    customerName: "",
    customerPhone: "",
    procedureId: treatments[0]?.treatmentId || "",
    procedureName: treatments[0]?.name || "",
    amount: treatments[0]?.price || 300,
    discount: 0,
    paymentMethod: "credit_card" as PaymentMethod,
    saleDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    category: "Medical Supplies & Serums" as ExpenseCategory,
    description: "",
    amount: 150,
    vendor: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  // Calculate Aggregates
  const totalIncome = useMemo(
    () => sales.reduce((sum, s) => sum + s.netAmount, 0),
    [sales]
  );
  const totalCost = useMemo(
    () => sales.reduce((sum, s) => sum + (s.totalCost || 0), 0),
    [sales]
  );
  const grossProfit = totalIncome - totalCost;
  const totalExpense = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const netMargin = totalIncome - totalExpense;

  // New Sale Form State (supports procedure and medicine)
  const [saleItemType, setSaleItemType] = useState<"procedure" | "medicine">("procedure");
  const [selectedMedId, setSelectedMedId] = useState<string>(pharmacy[0]?.itemId || "");
  const [saleQuantity, setSaleQuantity] = useState<number>(1);

  // Procedure change in sale form
  const handleProcedureSelect = (trtId: string) => {
    const trt = treatments.find((t) => t.treatmentId === trtId);
    if (trt) {
      setSaleForm({
        ...saleForm,
        procedureId: trt.treatmentId,
        procedureName: trt.name,
        amount: trt.price,
      });
    }
  };

  const handleMedicineSelect = (medId: string) => {
    setSelectedMedId(medId);
    const med = pharmacy.find((p) => p.itemId === medId);
    if (med) {
      setSaleForm({
        ...saleForm,
        procedureId: med.itemId,
        procedureName: `${med.name} (${saleQuantity} ${med.unit})`,
        amount: med.sellingPrice * saleQuantity,
      });
    }
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.customerName.trim()) {
      showToast("Missing Fields", "Please enter the customer name.", "warning");
      return;
    }

    if (saleItemType === "procedure") {
      const trt = treatments.find((t) => t.treatmentId === saleForm.procedureId);
      const costPrice = (trt?.costPrice || 0) * saleQuantity;
      const grossAmount = saleForm.amount;
      const netAmount = Math.max(0, grossAmount - saleForm.discount);
      const profit = netAmount - costPrice;

      addSale({
        ...saleForm,
        invoiceNumber: generateInvoiceNumber(),
        saleType: "procedure",
        items: [
          {
            id: saleForm.procedureId,
            name: saleForm.procedureName,
            type: "procedure",
            quantity: saleQuantity,
            unitPrice: trt?.price || grossAmount,
            costPrice: trt?.costPrice || 0,
            totalAmount: grossAmount,
            totalCost: costPrice,
            profit: profit,
            unit: "session",
          },
        ],
        amount: grossAmount,
        netAmount,
        totalCost: costPrice,
        profit: profit,
        recordedBy: user?.displayName || "Sheraz khan (Admin)",
      });
    } else {
      const med = pharmacy.find((p) => p.itemId === selectedMedId);
      if (!med) return;
      if (saleQuantity > med.quantity) {
        showToast(
          "Insufficient Stock",
          `Only ${med.quantity} ${med.unit} available in inventory.`,
          "error"
        );
        return;
      }
      const grossAmount = med.sellingPrice * saleQuantity;
      const costPrice = med.costPrice * saleQuantity;
      const netAmount = Math.max(0, grossAmount - saleForm.discount);
      const profit = netAmount - costPrice;

      addSale({
        ...saleForm,
        invoiceNumber: generateInvoiceNumber(),
        saleType: "medicine",
        procedureId: med.itemId,
        procedureName: `${med.name} (${saleQuantity} ${med.unit})`,
        items: [
          {
            id: med.itemId,
            name: med.name,
            type: "medicine",
            quantity: saleQuantity,
            unitPrice: med.sellingPrice,
            costPrice: med.costPrice,
            totalAmount: grossAmount,
            totalCost: costPrice,
            profit: profit,
            unit: med.unit,
            batchNumber: med.batchNumber,
          },
        ],
        amount: grossAmount,
        netAmount,
        totalCost: costPrice,
        profit: profit,
        recordedBy: user?.displayName || "Sheraz khan (Admin)",
      });
    }

    showToast(
      "Income Recorded & Stock Synced",
      `Sale logged successfully.`,
      "success"
    );
    setIsSaleModalOpen(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || expenseForm.amount <= 0) {
      showToast("Invalid Input", "Please enter description and amount.", "warning");
      return;
    }

    addExpense({
      ...expenseForm,
      recordedBy: user?.displayName || "Sheraz khan",
    });

    showToast(
      "Expense Recorded",
      `Expense of Rs. ${expenseForm.amount} under ${expenseForm.category} logged.`,
      "success"
    );
    setIsExpenseModalOpen(false);
  };

  const handleDeleteSale = (id: string, inv: string) => {
    if (confirm(`Delete sale invoice ${inv}?`)) {
      deleteSale(id);
      showToast("Sale Removed", `Invoice ${inv} was deleted.`, "info");
    }
  };

  const handleDeleteExpense = (id: string, desc: string) => {
    if (confirm(`Delete expense "${desc}"?`)) {
      deleteExpense(id);
      showToast("Expense Removed", `Expense "${desc}" was deleted.`, "info");
    }
  };

  // Sales Table Columns
  const saleColumns: Column<Sale>[] = [
    {
      header: "Invoice #",
      accessorKey: "invoiceNumber",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-white text-xs">
          {s.invoiceNumber}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "saleDate",
      sortable: true,
      cell: (s) => formatDate(s.saleDate),
    },
    {
      header: "Patient / Customer",
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
      header: "Item Description & Type",
      accessorKey: "procedureName",
      sortable: true,
      cell: (s) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                s.saleType === "medicine"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : s.saleType === "mixed"
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                  : "bg-clinic-500/10 text-clinic-300 border border-clinic-500/30"
              }`}
            >
              {s.saleType || "procedure"}
            </span>
            <span className="font-medium text-clinic-300 text-xs">
              {s.procedureName}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">By: {s.recordedBy}</p>
        </div>
      ),
    },
    {
      header: "Buy Price (Cost)",
      accessorKey: "totalCost",
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-xs text-slate-400">
          {formatCurrency(s.totalCost || 0)}
        </span>
      ),
    },
    {
      header: "Sale Price (Revenue)",
      accessorKey: "netAmount",
      sortable: true,
      cell: (s) => (
        <div className="text-right">
          <span className="font-mono font-bold text-white text-xs">
            {formatCurrency(s.netAmount)}
          </span>
          {s.discount > 0 && (
            <p className="text-[10px] text-rose-400">-{formatCurrency(s.discount)} disc</p>
          )}
        </div>
      ),
    },
    {
      header: "Profit (Gain)",
      accessorKey: "profit",
      sortable: true,
      cell: (s) => {
        const profit = s.profit !== undefined ? s.profit : s.netAmount - (s.totalCost || 0);
        const marginPercent = s.netAmount > 0 ? Math.round((profit / s.netAmount) * 100) : 0;
        return (
          <div className="text-right">
            <span className="font-mono font-bold text-emerald-400 text-xs">
              +{formatCurrency(profit)}
            </span>
            <p className="text-[10px] text-emerald-500 font-semibold">{marginPercent}% margin</p>
          </div>
        );
      },
    },
    {
      header: "Payment",
      accessorKey: "paymentMethod",
      cell: (s) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] capitalize">
          {s.paymentMethod.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedInvoiceSale(s)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5 text-gold-400" />
            <span>Receipt</span>
          </button>
          <button
            onClick={() => handleDeleteSale(s.saleId, s.invoiceNumber)}
            title="Delete Sale"
            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Expense Table Columns
  const expenseColumns: Column<Expense>[] = [
    {
      header: "Date",
      accessorKey: "expenseDate",
      sortable: true,
      cell: (e) => formatDate(e.expenseDate),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (e) => (
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          {e.category}
        </span>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      sortable: true,
      cell: (e) => (
        <div>
          <p className="font-semibold text-white text-xs">{e.description}</p>
          {e.vendor && (
            <p className="text-[11px] text-slate-400">Vendor: {e.vendor}</p>
          )}
        </div>
      ),
    },
    {
      header: "Recorded By",
      accessorKey: "recordedBy",
      cell: (e) => <span className="text-xs text-slate-400">{e.recordedBy}</span>,
    },
    {
      header: "Amount",
      accessorKey: "amount",
      sortable: true,
      cell: (e) => (
        <span className="font-mono font-bold text-rose-400 text-xs">
          -{formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (e) => (
        <button
          onClick={() => handleDeleteExpense(e.expenseId, e.description)}
          title="Delete Expense"
          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Master Financial Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Income & Expense Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Real-time cashier sales mapped to aesthetic procedures and clinical expenses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Income Sale</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-card/90 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Sale Price (Revenue)
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalIncome)}
            </h4>
            <span className="text-[11px] text-slate-400 font-light mt-0.5 block">
              Gross from {sales.length} transactions
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-card/90 border border-amber-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Cost of Goods (Buy Price)
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalCost)}
            </h4>
            <span className="text-[11px] text-slate-400 font-light mt-0.5 block">
              Procedures & Pharmacy COGS
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-card/90 border border-teal-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              Gross Sales Profit
            </p>
            <h4 className="text-2xl font-bold text-teal-300 font-mono mt-1">
              {formatCurrency(grossProfit)}
            </h4>
            <span className="text-[11px] text-emerald-400 font-medium mt-0.5 block">
              {totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : 0}% Margin
            </span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-card/90 border border-rose-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Net Clinical Profit
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(grossProfit - totalExpense)}
            </h4>
            <span className="text-[11px] text-slate-400 font-light mt-0.5 block">
              After {formatCurrency(totalExpense)} OpEx
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-dark-card/90 rounded-2xl border border-slate-700/80 max-w-md">
        <button
          onClick={() => setActiveTab("income")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "income"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Income / Sales by Procedure ({sales.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "expenses"
              ? "bg-gradient-to-r from-rose-600 to-clinic-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Clinic Expenses ({expenses.length})</span>
        </button>
      </div>

      {/* Tables based on active tab */}
      {activeTab === "income" ? (
        <DataTable
          data={sales}
          columns={saleColumns}
          searchPlaceholder="Search sales by patient, invoice number, or procedure..."
          searchKey="customerName"
        />
      ) : (
        <DataTable
          data={expenses}
          columns={expenseColumns}
          searchPlaceholder="Search expenses by category, vendor, or description..."
          searchKey="description"
        />
      )}

      {/* New Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Record Income Sale / Invoice"
        subtitle="Log procedure or pharmacy revenue, stock deduction, and profit calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
          {/* Sale Item Type Toggle */}
          <div className="flex p-1 bg-slate-900 border border-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setSaleItemType("procedure");
                if (treatments[0]) {
                  setSaleForm({
                    ...saleForm,
                    procedureId: treatments[0].treatmentId,
                    procedureName: treatments[0].name,
                    amount: treatments[0].price,
                  });
                }
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                saleItemType === "procedure"
                  ? "bg-clinic-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Clinical Procedure
            </button>
            <button
              type="button"
              onClick={() => {
                setSaleItemType("medicine");
                if (pharmacy[0]) {
                  setSelectedMedId(pharmacy[0].itemId);
                  setSaleForm({
                    ...saleForm,
                    procedureId: pharmacy[0].itemId,
                    procedureName: `${pharmacy[0].name} (${saleQuantity} ${pharmacy[0].unit})`,
                    amount: pharmacy[0].sellingPrice * saleQuantity,
                  });
                }
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                saleItemType === "medicine"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pharmacy Medicine / Product
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Patient / Customer Name
              </label>
              <input
                type="text"
                required
                value={saleForm.customerName}
                onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                placeholder="e.g. Victoria Sterling"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={saleForm.customerPhone}
                onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            {saleItemType === "procedure" ? (
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Select Clinical Procedure
                </label>
                <select
                  value={saleForm.procedureId}
                  onChange={(e) => handleProcedureSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                >
                  {treatments.map((t) => (
                    <option key={t.treatmentId} value={t.treatmentId}>
                      {t.name} — Sale: Rs. {t.price} | Buy Cost: Rs. {t.costPrice || 0} ({t.category})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Select Medicine / Inventory Item (Auto Stock Deduction)
                </label>
                <select
                  value={selectedMedId}
                  onChange={(e) => handleMedicineSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                >
                  {pharmacy.map((p) => (
                    <option key={p.itemId} value={p.itemId}>
                      {p.name} — Stock: {p.quantity} {p.unit} | Sale: Rs. {p.sellingPrice} | Cost: Rs. {p.costPrice}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Quantity {saleItemType === "medicine" ? "(Stock will be reduced)" : "(Sessions)"}
              </label>
              <input
                type="number"
                min={1}
                value={saleQuantity}
                onChange={(e) => {
                  const qty = Math.max(1, parseInt(e.target.value) || 1);
                  setSaleQuantity(qty);
                  if (saleItemType === "procedure") {
                    const trt = treatments.find((t) => t.treatmentId === saleForm.procedureId);
                    if (trt) setSaleForm((f) => ({ ...f, amount: trt.price * qty }));
                  } else {
                    const med = pharmacy.find((p) => p.itemId === selectedMedId);
                    if (med) setSaleForm((f) => ({ ...f, amount: med.sellingPrice * qty }));
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Total Selling Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={saleForm.amount}
                onChange={(e) =>
                  setSaleForm({ ...saleForm, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Discount / VIP Credit (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={saleForm.discount}
                onChange={(e) =>
                  setSaleForm({ ...saleForm, discount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Method
              </label>
              <select
                value={saleForm.paymentMethod}
                onChange={(e) =>
                  setSaleForm({
                    ...saleForm,
                    paymentMethod: e.target.value as PaymentMethod,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none capitalize"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Sale Date</label>
              <input
                type="date"
                value={saleForm.saleDate}
                onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Cashier Notes
            </label>
            <input
              type="text"
              value={saleForm.notes}
              onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
              placeholder="e.g. VIP Member special promo code applied"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>

          {/* Financial Breakdown Preview */}
          {(() => {
            const netAmount = Math.max(0, saleForm.amount - saleForm.discount);
            let estimatedCost = 0;
            if (saleItemType === "procedure") {
              const trt = treatments.find((t) => t.treatmentId === saleForm.procedureId);
              estimatedCost = (trt?.costPrice || 0) * saleQuantity;
            } else {
              const med = pharmacy.find((p) => p.itemId === selectedMedId);
              estimatedCost = (med?.costPrice || 0) * saleQuantity;
            }
            const estimatedProfit = netAmount - estimatedCost;
            return (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Net Sale</span>
                  <span className="text-sm font-bold text-white font-mono">{formatCurrency(netAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block uppercase">Buy Cost (COGS)</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{formatCurrency(estimatedCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase">Gross Profit</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(estimatedProfit)}</span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSaleModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg transition-all"
            >
              Save & Log Sale
            </button>
          </div>
        </form>
      </Modal>

      {/* New Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Operational Expense"
        subtitle="Log clinic bills, consumables, vendor invoices, or marketing costs"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Expense Category
            </label>
            <select
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  category: e.target.value as ExpenseCategory,
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, description: e.target.value })
              }
              placeholder="e.g. Restock Allergan Botox vials & topical numbing"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amount (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Expense Date
              </label>
              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Vendor / Beneficiary
            </label>
            <input
              type="text"
              value={expenseForm.vendor}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, vendor: e.target.value })
              }
              placeholder="e.g. Allergan Medical Supply LLC"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-clinic-600 hover:from-rose-500 hover:to-clinic-500 text-white font-bold shadow-lg transition-all"
            >
              Save Expense Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <InvoicePreview
        isOpen={Boolean(selectedInvoiceSale)}
        onClose={() => setSelectedInvoiceSale(null)}
        sale={selectedInvoiceSale}
        settings={settings}
      />
    </div>
  );
}
