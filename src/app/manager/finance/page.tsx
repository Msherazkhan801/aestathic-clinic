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
  Trash2,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Package,
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

export default function ManagerFinancePage() {
  const { user } = useAuth();
  const {
    sales,
    expenses,
    treatments,
    pharmacy,
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

  // New Sale State
  const [saleItemType, setSaleItemType] = useState<"procedure" | "medicine">("procedure");
  const [selectedMedId, setSelectedMedId] = useState<string>(pharmacy[0]?.itemId || "");
  const [saleQuantity, setSaleQuantity] = useState<number>(1);
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

  // New Expense State
  const [expenseForm, setExpenseForm] = useState({
    category: "Medical Supplies & Serums" as ExpenseCategory,
    description: "",
    amount: 150,
    vendor: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  // Aggregates
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
  const netMargin = grossProfit - totalExpense;

  const handleProcedureSelect = (trtId: string) => {
    const trt = treatments.find((t) => t.treatmentId === trtId);
    if (trt) {
      setSaleForm({
        ...saleForm,
        procedureId: trt.treatmentId,
        procedureName: trt.name,
        amount: trt.price * saleQuantity,
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
      showToast("Missing Patient Name", "Please enter the patient name.", "warning");
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
        recordedBy: user?.displayName || "Alexander Wright (Manager)",
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
        recordedBy: user?.displayName || "Alexander Wright (Manager)",
      });
    }

    showToast(
      "Income Recorded & Stock Updated",
      `Sale logged successfully.`,
      "success"
    );
    setIsSaleModalOpen(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || expenseForm.amount <= 0) {
      showToast("Invalid Input", "Please provide description and valid amount.", "warning");
      return;
    }

    addExpense({
      ...expenseForm,
      recordedBy: user?.displayName || "Alexander Wright (Manager)",
    });

    showToast(
      "Expense Logged",
      `Expense of Rs. ${expenseForm.amount} under ${expenseForm.category} recorded.`,
      "success"
    );
    setIsExpenseModalOpen(false);
  };

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
      header: "Patient / Client",
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
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${typeBadge}`}
              >
                {s.saleType || "procedure"}
              </span>
              <span className="font-medium text-slate-200 text-xs truncate max-w-[180px]">
                {s.procedureName}
              </span>
            </div>
            {s.items && s.items.length > 1 && (
              <p className="text-[10px] text-slate-400">
                +{s.items.length - 1} more item(s)
              </p>
            )}
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
      header: "Profit (Gain)",
      accessorKey: "profit",
      sortable: true,
      cell: (s) => {
        const profitVal = s.profit !== undefined ? s.profit : s.netAmount - (s.totalCost || 0);
        const marginPct = s.netAmount > 0 ? ((profitVal / s.netAmount) * 100).toFixed(0) : 0;
        return (
          <div>
            <span className="font-mono font-bold text-emerald-400 text-xs block">
              +{formatCurrency(profitVal)}
            </span>
            <span className="text-[10px] font-medium text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
              {marginPct}% margin
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedInvoiceSale(s)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1"
            title="Print Receipt / PDF"
          >
            <Receipt className="w-3.5 h-3.5 text-gold-400" />
            <span>Receipt</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete sale invoice ${s.invoiceNumber}?`)) {
                deleteSale(s.saleId);
                showToast("Sale Removed", "The invoice has been deleted.", "info");
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Sale"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

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
          onClick={() => {
            if (confirm(`Delete expense "${e.description}"?`)) {
              deleteExpense(e.expenseId);
              showToast("Expense Deleted", "Expense entry removed.", "info");
            }
          }}
          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
          title="Delete Expense"
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
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Manager Financial Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Clinic Sales, Buy Costs & Profits
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Real-time audit of sale prices, actual inventory buy costs, gross profits, and operating expenses.
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

      {/* KPI Cards */}
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
              Net Profit (After OpEx)
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(netMargin)}
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
          <span>Income / Sales ({sales.length})</span>
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
          <span>Expenses ({expenses.length})</span>
        </button>
      </div>

      {activeTab === "income" ? (
        <DataTable
          data={sales}
          columns={saleColumns}
          searchPlaceholder="Search sales by patient, invoice number, or product..."
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

      {/* Sale Modal */}
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
                    amount: treatments[0].price * saleQuantity,
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
                placeholder="e.g. Camilla Rodriguez"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Discount (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={saleForm.discount}
                onChange={(e) =>
                  setSaleForm({ ...saleForm, discount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Method
              </label>
              <select
                value={saleForm.paymentMethod}
                onChange={(e) =>
                  setSaleForm({ ...saleForm, paymentMethod: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none capitalize"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
              placeholder="e.g. Paid in full via debit terminal"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
              Save Sale
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Operational Expense"
        subtitle="Log clinic bills, consumables, and supply costs"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Category</label>
            <select
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, category: e.target.value as any })
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <input
              type="text"
              required
              value={expenseForm.description}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, description: e.target.value })
              }
              placeholder="e.g. Restock sterile micro-needling tips & serums"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, expenseDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
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
              Save Expense
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
