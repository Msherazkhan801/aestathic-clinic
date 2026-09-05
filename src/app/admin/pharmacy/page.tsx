"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { PharmacyItem, PharmacyCategory } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";

const CATEGORIES: PharmacyCategory[] = [
  "Skincare & Cosmeceuticals",
  "Injectables & Toxins",
  "Post-Procedure Care",
  "Supplies & Consumables",
  "Nutraceuticals",
];

export default function AdminPharmacyPage() {
  const {
    pharmacy,
    addPharmacyItem,
    updatePharmacyItem,
    deletePharmacyItem,
  } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Injectables & Toxins" as PharmacyCategory,
    quantity: 10,
    unit: "vials",
    minThreshold: 5,
    costPrice: 150,
    sellingPrice: 350,
    expiryDate: "2027-06-30",
    supplier: "Allergan Direct",
    batchNumber: "LOT-8921",
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Injectables & Toxins",
      quantity: 10,
      unit: "vials",
      minThreshold: 5,
      costPrice: 150,
      sellingPrice: 350,
      expiryDate: "2027-06-30",
      supplier: "Allergan Direct",
      batchNumber: "LOT-8921",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PharmacyItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minThreshold: item.minThreshold,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      expiryDate: item.expiryDate,
      supplier: item.supplier,
      batchNumber: item.batchNumber,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Missing Name", "Please provide product name.", "warning");
      return;
    }

    if (editingItem) {
      updatePharmacyItem(editingItem.itemId, formData);
      showToast("Inventory Updated", `${formData.name} stock details saved.`, "success");
    } else {
      addPharmacyItem(formData);
      showToast("Product Added", `${formData.name} registered in pharmacy inventory.`, "success");
    }
    setIsModalOpen(false);
  };

  const handleAdjustStock = (item: PharmacyItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updatePharmacyItem(item.itemId, { quantity: newQty });
    showToast(
      "Stock Adjusted",
      `${item.name} stock is now ${newQty} ${item.unit}.`,
      "info"
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} from pharmacy inventory?`)) {
      deletePharmacyItem(id);
      showToast("Item Removed", `${name} deleted.`, "info");
    }
  };

  const columns: Column<PharmacyItem>[] = [
    {
      header: "Product / Item",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-bold text-white text-xs">{item.name}</p>
          <p className="text-[11px] text-slate-400">Supplier: {item.supplier}</p>
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
      header: "Stock Level",
      accessorKey: "quantity",
      sortable: true,
      cell: (item) => {
        const isLow = item.quantity <= item.minThreshold;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                isLow
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {item.quantity} {item.unit}
            </span>
            {isLow && (
              <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Cost / Retail Price",
      accessorKey: "sellingPrice",
      sortable: true,
      cell: (item) => (
        <div className="text-xs">
          <p className="font-bold text-emerald-400 font-mono">
            {formatCurrency(item.sellingPrice)}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Cost: {formatCurrency(item.costPrice)}
          </p>
        </div>
      ),
    },
    {
      header: "Batch & Expiry",
      accessorKey: "expiryDate",
      sortable: true,
      cell: (item) => (
        <div className="text-xs">
          <p className="text-slate-200">{formatDate(item.expiryDate)}</p>
          <p className="text-[10px] text-slate-400 font-mono">LOT: {item.batchNumber}</p>
        </div>
      ),
    },
    {
      header: "Adjust Stock",
      cell: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAdjustStock(item, -1)}
            title="Dispense / Deduct 1"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
          >
            -1
          </button>
          <button
            onClick={() => handleAdjustStock(item, 5)}
            title="Restock +5"
            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40"
          >
            +5
          </button>
        </div>
      ),
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(item)}
            title="Edit Item"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(item.itemId, item.name)}
            title="Delete Item"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Pill className="w-4 h-4" />
            <span>Pharmacy & Cosmeceutical Dispensary</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Pharmacy & Clinical Supplies
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Inventory levels, minimum threshold warnings, batch expiry tracking, and dispensing.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pharmacy Item</span>
        </button>
      </div>

      {/* Inventory Table */}
      <DataTable
        data={pharmacy}
        columns={columns}
        searchPlaceholder="Search products, batches, suppliers, or categories..."
        searchKey="name"
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Pharmacy Product" : "Add New Medical / Skincare Product"}
        subtitle="Specify stock quantities, batch details, pricing, and reorder thresholds"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Botox Cosmetic 100U"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as PharmacyCategory,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Measurement Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. vials, boxes, bottles, syringes"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Minimum Alert Threshold
              </label>
              <input
                type="number"
                min={1}
                value={formData.minThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minThreshold: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Cost Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Retail Selling Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Allergan Aesthetics Direct"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Batch / LOT #
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g. AL-88291"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold shadow-glow transition-all"
            >
              {editingItem ? "Update Product" : "Save Product to Stock"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
