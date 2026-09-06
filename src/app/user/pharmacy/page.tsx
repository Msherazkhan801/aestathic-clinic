"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PharmacyItem, Sale, PaymentMethod } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { InvoicePreview } from "@/components/ui/InvoicePreview";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import {
  Pill,
  Plus,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  ShoppingCart,
  Receipt,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "digital_wallet",
  "insurance",
];

export default function UserPharmacyPage() {
  const { user } = useAuth();
  const { pharmacy, contacts, settings, addPharmacyItem, updatePharmacyItem, addSale } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<PharmacyItem | null>(null);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // New Product Form
  const [form, setForm] = useState({
    name: "",
    category: "Skincare & Cosmeceuticals" as any,
    quantity: 12,
    unit: "bottles",
    minThreshold: 5,
    costPrice: 40,
    sellingPrice: 85,
    expiryDate: "2027-08-30",
    supplier: "Dermaceutic Lab",
    batchNumber: "LOT-3011",
  });

  // Quick Sell Form
  const [sellForm, setSellForm] = useState({
    customerName: "",
    customerPhone: "",
    quantity: 1,
    discount: 0,
    paymentMethod: "credit_card" as PaymentMethod,
    notes: "",
  });

  const handleDispense = (item: PharmacyItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updatePharmacyItem(item.itemId, { quantity: newQty });
    if (delta < 0) {
      showToast(
        "Product Dispensed",
        `Dispensed 1 ${item.unit} of ${item.name}. Remaining: ${newQty}.`,
        "info"
      );
    } else {
      showToast(
        "Stock Added",
        `Added 1 ${item.unit} to ${item.name}. New total: ${newQty}.`,
        "success"
      );
    }
  };

  const handleOpenSell = (item: PharmacyItem) => {
    if (item.quantity <= 0) {
      showToast("Out of Stock", `${item.name} is currently out of stock.`, "error");
      return;
    }
    setSellingItem(item);
    setSellForm({
      customerName: "",
      customerPhone: "",
      quantity: 1,
      discount: 0,
      paymentMethod: "credit_card",
      notes: "",
    });
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;

    if (!sellForm.customerName.trim()) {
      showToast("Missing Name", "Please enter the patient name.", "warning");
      return;
    }

    if (sellForm.quantity > sellingItem.quantity) {
      showToast(
        "Insufficient Stock",
        `Only ${sellingItem.quantity} ${sellingItem.unit} available in stock.`,
        "error"
      );
      return;
    }

    const grossAmount = sellingItem.sellingPrice * sellForm.quantity;
    const totalCost = sellingItem.costPrice * sellForm.quantity;
    const netAmount = Math.max(0, grossAmount - sellForm.discount);
    const profit = netAmount - totalCost;

    const newSale = addSale({
      invoiceNumber: generateInvoiceNumber(),
      customerName: sellForm.customerName.trim(),
      customerPhone: sellForm.customerPhone || "+1 (555) 000-0000",
      saleType: "medicine",
      procedureId: sellingItem.itemId,
      procedureName: `${sellingItem.name} (${sellForm.quantity} ${sellingItem.unit})`,
      items: [
        {
          id: sellingItem.itemId,
          name: sellingItem.name,
          type: "medicine",
          quantity: sellForm.quantity,
          unitPrice: sellingItem.sellingPrice,
          costPrice: sellingItem.costPrice,
          totalAmount: grossAmount,
          totalCost: totalCost,
          profit: profit,
          unit: sellingItem.unit,
          batchNumber: sellingItem.batchNumber,
        },
      ],
      amount: grossAmount,
      discount: sellForm.discount,
      netAmount: netAmount,
      totalCost: totalCost,
      profit: profit,
      paymentMethod: sellForm.paymentMethod,
      saleDate: new Date().toISOString().split("T")[0],
      recordedBy: user?.displayName || "Isabella Rossi (Reception)",
      notes: sellForm.notes,
    });

    showToast(
      "Medicine Sold & Deducted",
      `Sold ${sellForm.quantity} ${sellingItem.unit} of ${sellingItem.name}. Stock updated!`,
      "success"
    );

    setSellingItem(null);
    setActiveReceiptSale(newSale);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Missing Name", "Please enter product name.", "warning");
      return;
    }

    addPharmacyItem(form);
    showToast("Product Added", `${form.name} added to dispensary catalog.`, "success");
    setIsModalOpen(false);
  };

  const columns: Column<PharmacyItem>[] = [
    {
      header: "Product / Cosmeceutical",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-bold text-white text-xs">{item.name}</p>
          <p className="text-[11px] text-slate-400">LOT: {item.batchNumber}</p>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (item) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
          {item.category}
        </span>
      ),
    },
    {
      header: "Available Stock",
      accessorKey: "quantity",
      sortable: true,
      cell: (item) => {
        const isLow = item.quantity <= item.minThreshold;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span
              className={
                isLow
                  ? "text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse"
                  : "text-emerald-400"
              }
            >
              {item.quantity} {item.unit}
            </span>
            {isLow && (
              <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Retail Price",
      accessorKey: "sellingPrice",
      sortable: true,
      cell: (item) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(item.sellingPrice)}
        </span>
      ),
    },
    {
      header: "Expiry Date",
      accessorKey: "expiryDate",
      sortable: true,
      cell: (item) => formatDate(item.expiryDate),
    },
    {
      header: "Sell / Dispense Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenSell(item)}
            disabled={item.quantity <= 0}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
              item.quantity <= 0
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Sell Product</span>
          </button>
          <button
            onClick={() => handleDispense(item, -1)}
            title="Fast -1 Dispense without invoice"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
          </button>
          <button
            onClick={() => handleDispense(item, 1)}
            title="Fast +1 Restock"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
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
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Pill className="w-4 h-4" />
            <span>Reception Dispensary Counter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Cosmeceuticals & Pharmacy Stock
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Dispense post-treatment recovery balms, serums, and sunscreen to patients upon checkout with automated stock deduction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/user/sales"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs uppercase tracking-wider transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Open Full POS Terminal</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      <DataTable
        data={pharmacy}
        columns={columns}
        searchPlaceholder="Search products by name, category, or LOT #..."
        searchKey="name"
      />

      {/* Quick Sell Modal */}
      <Modal
        isOpen={Boolean(sellingItem)}
        onClose={() => setSellingItem(null)}
        title={`Sell & Dispense: ${sellingItem?.name}`}
        subtitle={`Available Stock: ${sellingItem?.quantity} ${sellingItem?.unit} • Price: ${formatCurrency(sellingItem?.sellingPrice || 0)}`}
        maxWidth="xl"
      >
        {sellingItem && (
          <form onSubmit={handleSellSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  required
                  value={sellForm.customerName}
                  onChange={(e) => setSellForm({ ...sellForm, customerName: e.target.value })}
                  placeholder="e.g. Victoria Sterling"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={sellForm.customerPhone}
                  onChange={(e) => setSellForm({ ...sellForm, customerPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity to Sell ({sellingItem.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  max={sellingItem.quantity}
                  required
                  value={sellForm.quantity}
                  onChange={(e) =>
                    setSellForm({
                      ...sellForm,
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Discount (Rs.)
                </label>
                <input
                  type="number"
                  min={0}
                  value={sellForm.discount}
                  onChange={(e) =>
                    setSellForm({
                      ...sellForm,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Payment Method
                </label>
                <select
                  value={sellForm.paymentMethod}
                  onChange={(e) =>
                    setSellForm({
                      ...sellForm,
                      paymentMethod: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none capitalize"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Dispense Notes
              </label>
              <input
                type="text"
                value={sellForm.notes}
                onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                placeholder="e.g. Post-facial recovery serum dispense"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between font-mono">
              <span className="text-emerald-300 text-xs">Total Bill Amount:</span>
              <span className="text-base font-bold text-white">
                {formatCurrency(
                  Math.max(
                    0,
                    sellingItem.sellingPrice * sellForm.quantity - sellForm.discount
                  )
                )}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale & Print Receipt</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Product into Pharmacy"
        subtitle="Specify product name, quantity, price, and expiry"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. SkinCeuticals Triple Lipid Restore"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Skincare & Cosmeceuticals">
                  Skincare & Cosmeceuticals
                </option>
                <option value="Injectables & Toxins">Injectables & Toxins</option>
                <option value="Post-Procedure Care">Post-Procedure Care</option>
                <option value="Supplies & Consumables">Supplies & Consumables</option>
                <option value="Nutraceuticals">Nutraceuticals</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Quantity in Stock
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="bottles, tubes, boxes"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Cost Price (Buy Price) (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.costPrice}
                onChange={(e) =>
                  setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Selling Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                LOT / Batch Number
              </label>
              <input
                type="text"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg transition-all"
            >
              Save to Dispensary
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <InvoicePreview
        isOpen={Boolean(activeReceiptSale)}
        onClose={() => setActiveReceiptSale(null)}
        sale={activeReceiptSale}
        settings={settings}
      />
    </div>
  );
}
