"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
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
  const {
    sales,
    expenses,
    treatments,
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
  const totalExpense = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const netMargin = totalIncome - totalExpense;

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

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.customerName.trim()) {
      showToast("Missing Fields", "Please enter the customer name.", "warning");
      return;
    }

    const netAmount = Math.max(0, saleForm.amount - saleForm.discount);
    addSale({
      ...saleForm,
      invoiceNumber: generateInvoiceNumber(),
      netAmount,
      recordedBy: "Dr. Elena Vance",
    });

    showToast(
      "Income Recorded",
      `Sale for ${saleForm.procedureName} (Rs. ${netAmount}) logged successfully.`,
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
      recordedBy: "Dr. Elena Vance",
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
      header: "Procedure Description",
      accessorKey: "procedureName",
      sortable: true,
      cell: (s) => (
        <span className="font-medium text-clinic-300 text-xs">
          {s.procedureName}
        </span>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: "paymentMethod",
      cell: (s) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] capitalize">
          {s.paymentMethod.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "netAmount",
      sortable: true,
      cell: (s) => (
        <div className="text-right">
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {formatCurrency(s.netAmount)}
          </span>
          {s.discount > 0 && (
            <p className="text-[10px] text-rose-400">-{formatCurrency(s.discount)} disc</p>
          )}
        </div>
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
            <span>Invoice</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-dark-card/90 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Procedure Revenue
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalIncome)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-card/90 border border-rose-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Total Operating Expenses
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalExpense)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-card/90 border border-clinic-500/30 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-clinic-300 uppercase tracking-wider">
              Net Clinical Profit
            </p>
            <h4 className="text-2xl font-bold text-white font-mono mt-1">
              {formatCurrency(netMargin)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-clinic-500/10 text-clinic-300 border border-clinic-500/20">
            <DollarSign className="w-6 h-6" />
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
        subtitle="Log procedure revenue, patient details, and payment method"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
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

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Performed Clinical Procedure
              </label>
              <select
                value={saleForm.procedureId}
                onChange={(e) => handleProcedureSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                {treatments.map((t) => (
                  <option key={t.treatmentId} value={t.treatmentId}>
                    {t.name} — Rs. {t.price} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Procedure Amount (Rs.)
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

            <div>
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

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-emerald-300 font-medium">Net Amount Payable:</span>
            <span className="text-base font-bold text-white font-mono">
              {formatCurrency(Math.max(0, saleForm.amount - saleForm.discount))}
            </span>
          </div>

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
