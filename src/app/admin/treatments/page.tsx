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
  DollarSign,
  Tag,
  Layers,
} from "lucide-react";

const CATEGORIES: TreatmentCategory[] = [
  "Facials & Peels",
  "Injectables & Fillers",
  "Laser & IPL",
  "Skin Tightening",
  "Hair Restoration",
  "Body Contouring & Wellness",
];

export default function AdminTreatmentsPage() {
  const { treatments, addTreatment, updateTreatment, deleteTreatment } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrt, setEditingTrt] = useState<Treatment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 350,
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
        <span className="px-2.5 py-0.5 rounded-full bg-clinic-500/10 border border-clinic-500/30 text-clinic-300 text-[11px] font-medium">
          {trt.category}
        </span>
      ),
    },
    {
      header: "Standard Duration",
      accessorKey: "duration",
      sortable: true,
      cell: (trt) => (
        <div className="flex items-center gap-1 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-clinic-400" />
          <span>{trt.duration} minutes</span>
        </div>
      ),
    },
    {
      header: "Standard Price",
      accessorKey: "price",
      sortable: true,
      cell: (trt) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(trt.price)}
        </span>
      ),
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
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkle className="w-4 h-4" />
            <span>Clinical Procedures & Offerings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Treatments & Procedures Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Maintain official treatment menu, pricing, duration, and clinical descriptions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Treatment</span>
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
        title={editingTrt ? "Edit Clinical Procedure" : "Add New Clinical Treatment"}
        subtitle="Configure procedure name, price, session length, and description"
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
                placeholder="e.g. Fractional CO2 Laser Resurfacing"
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
                    category: e.target.value as TreatmentCategory,
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
                Standard Price (Rs.)
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isTrtActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-clinic-500 focus:ring-clinic-500"
              />
              <label htmlFor="isTrtActive" className="text-slate-300 font-medium">
                Active & bookable in schedule
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
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none custom-scrollbar"
            />
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
              {editingTrt ? "Update Treatment" : "Save Treatment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
