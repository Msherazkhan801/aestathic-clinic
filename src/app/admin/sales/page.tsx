"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Sale,
  SaleItem,
  Treatment,
  PharmacyItem,
  PaymentMethod,
} from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { InvoicePreview } from "@/components/ui/InvoicePreview";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import {
  ShoppingCart,
  Receipt,
  Plus,
  Minus,
  Trash2,
  Sparkle,
  Pill,
  Search,
  User,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  DollarSign,
} from "lucide-react";

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "digital_wallet",
  "insurance",
];

interface CartItem {
  id: string;
  name: string;
  type: "procedure" | "medicine";
  unitPrice: number;
  costPrice: number;
  quantity: number;
  availableStock?: number;
  unit?: string;
  batchNumber?: string;
}

export default function AdminSalesPage() {
  const { user } = useAuth();
  const { treatments, pharmacy, sales, contacts, settings, addSale } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
  const [catalogFilter, setCatalogFilter] = useState<"all" | "procedures" | "medicines">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [saleNotes, setSaleNotes] = useState("");

  // Selected Sale for Receipt Modal
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Filtered Catalog
  const filteredProcedures = useMemo(() => {
    if (catalogFilter === "medicines") return [];
    return treatments.filter(
      (t) =>
        t.isActive &&
        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [treatments, catalogFilter, searchQuery]);

  const filteredMedicines = useMemo(() => {
    if (catalogFilter === "procedures") return [];
    return pharmacy.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pharmacy, catalogFilter, searchQuery]);

  // Cart Actions
  const addToCart = (
    item: Treatment | PharmacyItem,
    type: "procedure" | "medicine"
  ) => {
    const itemId = type === "procedure" ? (item as Treatment).treatmentId : (item as PharmacyItem).itemId;
    const existingIndex = cart.findIndex((c) => c.id === itemId);

    if (type === "medicine") {
      const med = item as PharmacyItem;
      if (med.quantity <= 0) {
        showToast("Out of Stock", `${med.name} is currently out of stock!`, "error");
        return;
      }
      if (existingIndex >= 0 && cart[existingIndex].quantity >= med.quantity) {
        showToast(
          "Stock Limit Reached",
          `Only ${med.quantity} ${med.unit} available in stock.`,
          "warning"
        );
        return;
      }
    }

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      const isMed = type === "medicine";
      const med = item as PharmacyItem;
      const trt = item as Treatment;

      setCart([
        ...cart,
        {
          id: itemId,
          name: item.name,
          type,
          unitPrice: isMed ? med.sellingPrice : trt.price,
          costPrice: isMed ? med.costPrice : (trt.costPrice || 0),
          quantity: 1,
          availableStock: isMed ? med.quantity : undefined,
          unit: isMed ? med.unit : "session",
          batchNumber: isMed ? med.batchNumber : undefined,
        },
      ]);
    }

    showToast("Added to Invoice", `${item.name} added to cart.`, "info");
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;

    if (delta > 0 && item.type === "medicine" && item.availableStock !== undefined) {
      if (item.quantity >= item.availableStock) {
        showToast(
          "Stock Limit",
          `Cannot exceed available inventory (${item.availableStock} ${item.unit}).`,
          "warning"
        );
        return;
      }
    }

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.id !== id));
    } else {
      setCart(cart.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSaleNotes("");
  };

  // Cart Financials
  const grossSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );
  const totalCost = useMemo(
    () => cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0),
    [cart]
  );
  const netPayable = Math.max(0, grossSubtotal - discount);
  const estimatedProfit = Math.max(0, netPayable - totalCost);
  const profitMarginPct = netPayable > 0 ? ((estimatedProfit / netPayable) * 100).toFixed(0) : 0;

  // Handle Contact Select
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    const c = contacts.find((cnt) => cnt.contactId === contactId);
    if (c) {
      setPatientName(c.name);
      setPatientPhone(c.phone);
    }
  };

  // Complete Checkout Sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast("Empty Bill", "Please add procedures or medicines to the cart.", "warning");
      return;
    }

    const finalName = patientName.trim();
    if (!finalName) {
      showToast("Patient Required", "Please specify patient name for receipt.", "warning");
      return;
    }

    const hasProcedures = cart.some((i) => i.type === "procedure");
    const hasMedicines = cart.some((i) => i.type === "medicine");
    const saleType =
      hasProcedures && hasMedicines
        ? "mixed"
        : hasMedicines
        ? "medicine"
        : "procedure";

    const saleItems: SaleItem[] = cart.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      totalAmount: item.unitPrice * item.quantity,
      totalCost: item.costPrice * item.quantity,
      profit: item.unitPrice * item.quantity - item.costPrice * item.quantity,
      unit: item.unit,
      batchNumber: item.batchNumber,
    }));

    const procedureNameSummary =
      cart.length === 1
        ? cart[0].name
        : `${cart[0].name} + ${cart.length - 1} item${cart.length > 2 ? "s" : ""}`;

    const createdSale = addSale({
      invoiceNumber: generateInvoiceNumber(),
      customerName: finalName,
      customerPhone: patientPhone || "+1 (555) 000-0000",
      saleType,
      procedureId: cart[0].id,
      procedureName: procedureNameSummary,
      items: saleItems,
      amount: grossSubtotal,
      discount: discount || 0,
      netAmount: netPayable,
      totalCost,
      profit: estimatedProfit,
      paymentMethod,
      saleDate: new Date().toISOString().split("T")[0],
      recordedBy: user?.displayName || "Sheraz khan (Admin)",
      notes: saleNotes,
    });

    showToast(
      "Sale Completed & Stock Deducted",
      `Invoice ${createdSale.invoiceNumber} recorded. Total: ${formatCurrency(netPayable)}.`,
      "success"
    );

    setActiveReceiptSale(createdSale);
    clearCart();
    setPatientName("");
    setPatientPhone("");
    setSelectedContactId("");
  };

  // Sales Table Columns for History Tab (Admin sees Buy Cost, Sale Price, Profit)
  const salesColumns: Column<Sale>[] = [
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
      header: "Patient",
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
      header: "Items / Procedures Sold",
      accessorKey: "procedureName",
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
            <span className="font-medium text-slate-200 text-xs truncate max-w-xs">
              {s.procedureName}
            </span>
          </div>
          {s.items && s.items.length > 1 && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {s.items.length} itemized lines in invoice
            </p>
          )}
        </div>
      ),
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
      header: "Buy Cost",
      accessorKey: "totalCost",
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-medium text-amber-400 text-xs">
          {formatCurrency(s.totalCost || 0)}
        </span>
      ),
    },
    {
      header: "Sale Price",
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
        return (
          <span className="font-mono font-bold text-emerald-400 text-xs">
            +{formatCurrency(profitVal)}
          </span>
        );
      },
    },
    {
      header: "Receipt",
      cell: (s) => (
        <button
          onClick={() => setActiveReceiptSale(s)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Receipt className="w-3.5 h-3.5 text-gold-400" />
          <span>Receipt</span>
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
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Point of Sale & Billing Terminal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Sales & Invoicing Counter
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Sell aesthetic clinical procedures and pharmacy medicines with live stock deduction, cost auditing, and receipts.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1.5 bg-dark-card/90 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "pos"
                ? "bg-gradient-to-r from-clinic-600 to-gold-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Billing POS</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales History ({sales.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "pos" ? (
        /* POS 2-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Catalog Browser */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 backdrop-blur-xl space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search procedures or medicines by name, LOT, or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-clinic-500 focus:outline-none"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatalogFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    catalogFilter === "all"
                      ? "bg-clinic-500 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                  }`}
                >
                  All Items ({treatments.length + pharmacy.length})
                </button>
                <button
                  onClick={() => setCatalogFilter("procedures")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    catalogFilter === "procedures"
                      ? "bg-rose-500 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                  }`}
                >
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Procedures ({treatments.length})</span>
                </button>
                <button
                  onClick={() => setCatalogFilter("medicines")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    catalogFilter === "medicines"
                      ? "bg-teal-500 text-white shadow-md"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Medicines & Dispensary ({pharmacy.length})</span>
                </button>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-4">
              {/* Procedures Section */}
              {filteredProcedures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-clinic-300 uppercase tracking-wider px-1">
                    <Sparkle className="w-3.5 h-3.5 text-clinic-400" />
                    <span>Clinical Aesthetic Procedures</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredProcedures.map((trt) => (
                      <div
                        key={trt.treatmentId}
                        className="p-4 rounded-2xl bg-dark-card/90 border border-slate-700/80 hover:border-clinic-500/50 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-white text-xs group-hover:text-clinic-300 transition-colors">
                              {trt.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md bg-clinic-500/10 border border-clinic-500/30 text-clinic-300 text-[10px] whitespace-nowrap font-medium">
                              {trt.duration}m
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {trt.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Rate:</span>
                            <p className="font-mono font-bold text-emerald-400 text-sm">
                              {formatCurrency(trt.price)}
                            </p>
                            <span className="text-[10px] text-amber-400 block font-mono">
                              Cost: {formatCurrency(trt.costPrice || 0)}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(trt, "procedure")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clinic-600 hover:bg-clinic-500 text-white font-bold text-xs shadow-md transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicines Section */}
              {filteredMedicines.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider px-1">
                    <Pill className="w-3.5 h-3.5 text-teal-400" />
                    <span>Pharmacy Medicines & Cosmeceuticals</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredMedicines.map((med) => {
                      const isLow = med.quantity <= med.minThreshold;
                      const isOutOfStock = med.quantity <= 0;

                      return (
                        <div
                          key={med.itemId}
                          className={`p-4 rounded-2xl bg-dark-card/90 border transition-all flex flex-col justify-between gap-3 group ${
                            isOutOfStock
                              ? "border-rose-500/30 opacity-60"
                              : "border-slate-700/80 hover:border-emerald-500/50"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
                                {med.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${
                                  isOutOfStock
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                    : isLow
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {isOutOfStock
                                  ? "Out of Stock"
                                  : `${med.quantity} ${med.unit}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              LOT: {med.batchNumber} • {med.category}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">
                                Retail:
                              </span>
                              <p className="font-mono font-bold text-emerald-400 text-sm">
                                {formatCurrency(med.sellingPrice)}
                              </p>
                              <span className="text-[10px] text-amber-400 block font-mono">
                                Buy: {formatCurrency(med.costPrice)}
                              </span>
                            </div>
                            <button
                              disabled={isOutOfStock}
                              onClick={() => addToCart(med, "medicine")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                                isOutOfStock
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Dispense</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredProcedures.length === 0 && filteredMedicines.length === 0 && (
                <div className="p-8 text-center rounded-2xl bg-dark-card/50 border border-slate-800 text-slate-400 text-xs">
                  No products or procedures found matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout & Cart Terminal */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-dark-card/95 border border-slate-700/90 shadow-glass-dark backdrop-blur-2xl space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-clinic-500/10 border border-clinic-500/30 text-clinic-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      Patient Sales Order
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {cart.length} item{cart.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {/* Cart Line Items */}
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.type === "medicine" ? (
                            <Pill className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Sparkle className="w-3.5 h-3.5 text-clinic-400 flex-shrink-0" />
                          )}
                          <p className="font-bold text-white truncate">{item.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Sale: {formatCurrency(item.unitPrice)} | Cost: {formatCurrency(item.costPrice)}
                          {item.type === "medicine" && item.availableStock !== undefined && (
                            <span className="text-[10px] text-slate-500 ml-1.5">
                              (Stock: {item.availableStock})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-slate-300 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono font-bold text-white text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-slate-300 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-emerald-400 text-xs w-16 text-right">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">No items added to invoice yet.</p>
                    <p className="text-[10px] text-slate-600">
                      Click &quot;Add&quot; or &quot;Dispense&quot; from catalog on the left.
                    </p>
                  </div>
                )}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-3 border-t border-slate-800 text-xs">
                {/* Patient Selection Mode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-clinic-400" />
                      <span>Patient / Client</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPatientMode("existing");
                          if (contacts.length > 0) handleContactSelect(contacts[0].contactId);
                        }}
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          patientMode === "existing"
                            ? "bg-clinic-500/20 text-clinic-300 border border-clinic-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Registered
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientMode("new");
                          setPatientName("");
                          setPatientPhone("");
                        }}
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          patientMode === "new"
                            ? "bg-clinic-500/20 text-clinic-300 border border-clinic-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Walk-in New
                      </button>
                    </div>
                  </div>

                  {patientMode === "existing" ? (
                    <select
                      value={selectedContactId}
                      onChange={(e) => handleContactSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                    >
                      <option value="">-- Choose Registered Patient --</option>
                      {contacts.map((c) => (
                        <option key={c.contactId} value={c.contactId}>
                          {c.name} ({c.phone}) — {c.totalVisits} visits
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Patient Full Name"
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method & Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none capitalize"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Discount (Rs.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cashier Note / Remarks
                  </label>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="e.g. VIP Member special promo code applied"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                  />
                </div>

                {/* Admin Financial Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono text-slate-200">
                      {formatCurrency(grossSubtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-amber-400 text-[11px]">
                    <span>Buy / Consumables Cost:</span>
                    <span className="font-mono">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-teal-400 text-[11px]">
                    <span>Gross Profit Gain:</span>
                    <span className="font-mono font-bold">+{formatCurrency(estimatedProfit)} ({profitMarginPct}%)</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Net Payable:</span>
                    <span className="font-mono text-emerald-400 text-base">
                      {formatCurrency(netPayable)}
                    </span>
                  </div>
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow ${
                    cart.length === 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-gradient-to-r from-clinic-600 via-gold-600 to-clinic-500 hover:from-clinic-500 hover:to-gold-500 text-white shadow-xl"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Sale & Print Receipt</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <DataTable
            data={sales}
            columns={salesColumns}
            searchPlaceholder="Search sales by invoice #, patient, or procedure..."
            searchKey="customerName"
          />
        </div>
      )}

      {/* Invoice / Print Receipt Modal */}
      <InvoicePreview
        isOpen={Boolean(activeReceiptSale)}
        onClose={() => setActiveReceiptSale(null)}
        sale={activeReceiptSale}
        settings={settings}
      />
    </div>
  );
}
