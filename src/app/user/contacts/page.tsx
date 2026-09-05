"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Contact } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function UserContactsPage() {
  const { contacts, addContact, updateContact } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    dob: "1992-06-10",
    gender: "Female" as any,
    skinType: "Normal" as any,
    allergies: "None",
    notes: "",
  });

  const handleOpenAdd = () => {
    setEditingContact(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      dob: "1992-06-10",
      gender: "Female",
      skinType: "Normal",
      allergies: "None",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address || "",
      dob: c.dob || "1992-06-10",
      gender: c.gender || "Female",
      skinType: c.skinType || "Normal",
      allergies: c.allergies || "None",
      notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast("Missing Fields", "Please enter patient name and contact phone.", "warning");
      return;
    }

    if (editingContact) {
      updateContact(editingContact.contactId, form);
      showToast("Patient Updated", `${form.name}'s profile saved.`, "success");
    } else {
      addContact(form);
      showToast("Patient Registered", `${form.name} registered into CRM.`, "success");
    }
    setIsModalOpen(false);
  };

  const columns: Column<Contact>[] = [
    {
      header: "Patient",
      accessorKey: "name",
      sortable: true,
      cell: (c) => (
        <div>
          <p className="font-bold text-white text-xs">{c.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>{c.phone}</span>
            <span>•</span>
            <span>{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Skin & Allergies",
      cell: (c) => (
        <div className="text-xs">
          <p className="text-slate-200">
            <span className="text-emerald-400 font-semibold">Skin:</span> {c.skinType}
          </p>
          {c.allergies && c.allergies !== "None" && (
            <p className="text-[11px] text-rose-400">
              <span className="font-semibold">Allergy:</span> {c.allergies}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Visits Count",
      accessorKey: "totalVisits",
      sortable: true,
      cell: (c) => (
        <div className="text-xs">
          <p className="font-bold text-white">{c.totalVisits} Consultations</p>
          <p className="text-[10px] text-slate-400">Last: {formatDate(c.lastVisit) || "—"}</p>
        </div>
      ),
    },
    {
      header: "Notes",
      accessorKey: "notes",
      cell: (c) => (
        <span className="text-xs text-slate-400 italic truncate max-w-xs block">
          {c.notes || "No special notes"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (c) => (
        <button
          onClick={() => handleOpenEdit(c)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>Patient Relationship Directory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Patient Directory & CRM
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Register incoming clients, record allergies, skin types, and preferences.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      <DataTable
        data={contacts}
        columns={columns}
        searchPlaceholder="Search patients by name or phone..."
        searchKey="name"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? "Edit Patient Record" : "Register Patient in CRM"}
        subtitle="Capture contact details, skin characteristics, and allergies"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Camilla Rodriguez"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@email.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Skin Type
              </label>
              <select
                value={form.skinType}
                onChange={(e) => setForm({ ...form, skinType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
                <option value="Sensitive">Sensitive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Allergies / Sensitivities
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="e.g. Latex, Aspirin, Fragrance"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Patient Preferences & Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Prefers morning appointments, loves HydraFacial."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none custom-scrollbar"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg transition-all"
            >
              {editingContact ? "Update Record" : "Register Patient"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
