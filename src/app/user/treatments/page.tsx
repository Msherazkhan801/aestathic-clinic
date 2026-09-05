"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Treatment } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Sparkle, Clock, DollarSign, Search, Tag } from "lucide-react";

export default function UserTreatmentsPage() {
  const { treatments } = useData();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filtered = treatments.filter((t) =>
    selectedCategory === "ALL" ? true : t.category === selectedCategory
  );

  const columns: Column<Treatment>[] = [
    {
      header: "Procedure / Service",
      accessorKey: "name",
      sortable: true,
      cell: (t) => (
        <div>
          <p className="font-bold text-white text-xs">{t.name}</p>
          <p className="text-[11px] text-slate-400 font-light truncate max-w-sm">
            {t.description}
          </p>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (t) => (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
          {t.category}
        </span>
      ),
    },
    {
      header: "Duration",
      accessorKey: "duration",
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-clinic-400" />
          <span>{t.duration} mins</span>
        </div>
      ),
    },
    {
      header: "Quoted Price",
      accessorKey: "price",
      sortable: true,
      cell: (t) => (
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {formatCurrency(t.price)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Sparkle className="w-4 h-4" />
          <span>Reception Treatment Price Lookup</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Treatment Catalog & Pricing Menu
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
          Look up procedure durations, standard prices, and clinical descriptions for client inquiries.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "Facials & Peels", "Injectables & Fillers", "Laser & IPL", "Skin Tightening"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                  : "bg-dark-card border border-slate-700/80 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search procedures or descriptions..."
        searchKey="name"
      />
    </div>
  );
}
