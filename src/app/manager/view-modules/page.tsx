"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Appointment, PharmacyItem, Treatment } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import {
  Calendar,
  Pill,
  Sparkle,
  Eye,
  AlertTriangle,
  Clock,
  Briefcase,
} from "lucide-react";

export default function ManagerViewModulesPage() {
  const { appointments, pharmacy, treatments } = useData();
  const [activeTab, setActiveTab] = useState<"appointments" | "pharmacy" | "treatments">("appointments");

  // Appointment Columns (Read-only)
  const appointmentColumns: Column<Appointment>[] = [
    {
      header: "Patient",
      accessorKey: "customerName",
      sortable: true,
      cell: (a) => (
        <div>
          <p className="font-bold text-white text-xs">{a.customerName}</p>
          <p className="text-[11px] text-slate-400">{a.customerPhone}</p>
        </div>
      ),
    },
    {
      header: "Procedure",
      accessorKey: "procedureName",
      sortable: true,
      cell: (a) => (
        <span className="font-semibold text-amber-300 text-xs">{a.procedureName}</span>
      ),
    },
    {
      header: "Assigned Staff",
      accessorKey: "employeeName",
      sortable: true,
      cell: (a) => <span className="text-xs text-slate-200">{a.employeeName}</span>,
    },
    {
      header: "Date & Time",
      accessorKey: "appointmentDate",
      sortable: true,
      cell: (a) => (
        <div className="text-xs">
          <p className="font-medium text-white">{formatDate(a.appointmentDate)}</p>
          <p className="text-[11px] text-slate-400 font-mono">{formatTime(a.appointmentTime)}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (a) => <StatusBadge status={a.status} />,
    },
  ];

  // Pharmacy Columns (Read-only)
  const pharmacyColumns: Column<PharmacyItem>[] = [
    {
      header: "Item Name",
      accessorKey: "name",
      sortable: true,
      cell: (p) => <span className="font-bold text-white text-xs">{p.name}</span>,
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (p) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
          {p.category}
        </span>
      ),
    },
    {
      header: "Current Stock",
      accessorKey: "quantity",
      sortable: true,
      cell: (p) => {
        const isLow = p.quantity <= p.minThreshold;
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
            <span
              className={
                isLow ? "text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded" : "text-emerald-400"
              }
            >
              {p.quantity} {p.unit}
            </span>
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        );
      },
    },
    {
      header: "Selling Price",
      accessorKey: "sellingPrice",
      sortable: true,
      cell: (p) => (
        <span className="font-mono text-emerald-400 text-xs font-semibold">
          {formatCurrency(p.sellingPrice)}
        </span>
      ),
    },
    {
      header: "Expiry Date",
      accessorKey: "expiryDate",
      sortable: true,
      cell: (p) => formatDate(p.expiryDate),
    },
  ];

  // Treatments Columns (Read-only)
  const treatmentColumns: Column<Treatment>[] = [
    {
      header: "Treatment Name",
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
        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[11px]">
          {t.category}
        </span>
      ),
    },
    {
      header: "Duration",
      accessorKey: "duration",
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-1 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.duration} mins</span>
        </div>
      ),
    },
    {
      header: "Procedure Price",
      accessorKey: "price",
      sortable: true,
      cell: (t) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(t.price)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Eye className="w-4 h-4" />
          <span>Clinical Operations Oversight (View-Only)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Clinic Directory & Inventory
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
          View-only access to master appointment schedules, pharmacy stock, and clinical treatment offerings.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-dark-card/90 rounded-2xl border border-slate-700/80 max-w-lg">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "appointments"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "pharmacy"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Pharmacy Stock ({pharmacy.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("treatments")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "treatments"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkle className="w-4 h-4" />
          <span>Treatments ({treatments.length})</span>
        </button>
      </div>

      {/* Render selected view-only table */}
      {activeTab === "appointments" && (
        <DataTable
          data={appointments}
          columns={appointmentColumns}
          searchPlaceholder="Search appointments..."
          searchKey="customerName"
        />
      )}

      {activeTab === "pharmacy" && (
        <DataTable
          data={pharmacy}
          columns={pharmacyColumns}
          searchPlaceholder="Search pharmacy stock..."
          searchKey="name"
        />
      )}

      {activeTab === "treatments" && (
        <DataTable
          data={treatments}
          columns={treatmentColumns}
          searchPlaceholder="Search treatments..."
          searchKey="name"
        />
      )}
    </div>
  );
}
