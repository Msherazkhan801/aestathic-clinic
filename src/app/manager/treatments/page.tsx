"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Treatment, TreatmentCategory } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkle,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Briefcase,
} from "lucide-react";

const CATEGORIES: TreatmentCategory[] = [
  "Facials & Peels",
  "Injectables & Fillers",
  "Laser & IPL",
  "Skin Tightening",
  "Hair Restoration",
  "Body Contouring & Wellness",
];

export default function ManagerTreatmentsPage() {
  const { treatments, addTreatment, updateTreatment, deleteTreatment } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrt, setEditingTrt] = useState<Treatment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 350,
    costPrice: 80,
    duration: 60,
    category: "Injectables & Fillers" as TreatmentCategory,
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingTrt(null);
    setFormData({
      name: "",
      description: "",
      price: 350,
      costPrice: 80,
      duration: 60,
      category: "Injectables & Fillers",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trt: Treatment) => {
    setEditingTrt(trt);
    setFormData({
      name: trt.name,
      description: trt.description,
      price: trt.price,
      costPrice: trt.costPrice || 0,
      duration: trt.duration,
      category: trt.category,
      isActive: trt.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Missing Name", "Please enter procedure name.", "warning");
      return;
    }

    if (editingTrt) {
      updateTreatment(editingTrt.treatmentId, formData);
      showToast("Procedure Updated", `${formData.name} catalog record saved.`, "success");
    } else {
      addTreatment(formData);
      showToast("Procedure Added", `${formData.name} added to treatment menu.`, "success");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} from clinical catalog?`)) {
      deleteTreatment(id);
      showToast("Procedure Removed", `${name} was deleted.`, "info");
    }
  };

  const columns: Column<Treatment>[] = [
    {
      header: "Procedure Name",
      accessorKey: "name",
      sortable: true,
      cell: (trt) => (
        <div>
          <p className="font-bold text-white text-xs">{trt.name}</p>
          <p className="text-[11px] text-slate-400 font-light truncate max-w-sm">
            {trt.description}
          </p>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (trt) => (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
          {trt.category}
        </span>
      ),
    },
    {
      header: "Duration",
      accessorKey: "duration",
      sortable: true,
      cell: (trt) => (
        <div className="flex items-center gap-1 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{trt.duration} mins</span>
        </div>
      ),
    },
    {
      header: "Buy / Consumable Cost",
      accessorKey: "costPrice",
      sortable: true,
      cell: (trt) => (
        <span className="font-mono font-medium text-amber-400 text-xs">
          {formatCurrency(trt.costPrice || 0)}
        </span>
      ),
    },
    {
      header: "Selling Price",
      accessorKey: "price",
      sortable: true,
      cell: (trt) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(trt.price)}
        </span>
      ),
    },
    {
      header: "Gross Margin",
      cell: (trt) => {
        const cost = trt.costPrice || 0;
        const profit = trt.price - cost;
        const marginPct = trt.price > 0 ? ((profit / trt.price) * 100).toFixed(0) : 0;
        return (
          <div>
            <span className="font-mono font-bold text-teal-300 text-xs block">
              +{formatCurrency(profit)}
            </span>
            <span className="text-[10px] text-teal-400/80">{marginPct}% margin</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (trt) => <StatusBadge status={trt.isActive ? "active" : "inactive"} />,
    },
    {
      header: "Actions",
      cell: (trt) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(trt)}
            title="Edit Treatment"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(trt.treatmentId, trt.name)}
            title="Delete Treatment"
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
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Manager Treatment Menu & Procedures</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Treatments & Procedures Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Add and manage clinical aesthetic procedures, service pricing, and consumables costs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Procedure</span>
        </button>
      </div>

      {/* Treatments Table */}
      <DataTable
        data={treatments}
        columns={columns}
        searchPlaceholder="Search treatments by procedure name or category..."
        searchKey="name"
      />

      {/* Add / Edit Treatment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrt ? "Edit Clinical Procedure" : "Add New Clinical Procedure"}
        subtitle="Configure procedure name, consumables cost, selling price, and session length"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Procedure Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Microneedling with PRP Boost"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as TreatmentCategory,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
                Session Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                required
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value, 10) || 30,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-400 font-medium mb-1">
                Consumables / Buy Cost (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-emerald-400 font-medium mb-1">
                Selling Price to Patient (Rs.)
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isMgrTrtActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="isMgrTrtActive" className="text-slate-300 font-medium">
                Active & bookable in schedule & POS terminal
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Clinical Description & Protocol
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g. Deep vortex cleansing with custom booster infusion and red LED therapy."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none custom-scrollbar"
            />
          </div>

          {/* Live Profit Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Selling Price</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(formData.price)}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block uppercase">Consumable Cost</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{formatCurrency(formData.costPrice)}</span>
            </div>
            <div>
              <span className="text-[10px] text-teal-400 block uppercase">Profit Gain</span>
              <span className="text-sm font-bold text-teal-300 font-mono">
                +{formatCurrency(Math.max(0, formData.price - formData.costPrice))}
              </span>
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold shadow-lg transition-all"
            >
              {editingTrt ? "Update Treatment" : "Save Treatment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
