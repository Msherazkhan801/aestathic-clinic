"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Contact } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Contact as ContactIcon,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  HeartPulse,
} from "lucide-react";

export default function AdminContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    dob: "1990-05-15",
    gender: "Female" as "Female" | "Male" | "Other" | "Prefer not to say",
    skinType: "Combination" as "Normal" | "Dry" | "Oily" | "Combination" | "Sensitive",
    medicalHistory: "",
    allergies: "None",
    notes: "",
  });

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      dob: "1990-05-15",
      gender: "Female",
      skinType: "Combination",
      medicalHistory: "",
      allergies: "None",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address || "",
      dob: c.dob || "1990-05-15",
      gender: c.gender || "Female",
      skinType: c.skinType || "Combination",
      medicalHistory: c.medicalHistory || "",
      allergies: c.allergies || "None",
      notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast("Missing Fields", "Please enter patient name and phone number.", "warning");
      return;
    }

    if (editingContact) {
      updateContact(editingContact.contactId, formData);
      showToast("Patient Profile Updated", `${formData.name}'s record saved.`, "success");
    } else {
      addContact(formData);
      showToast("Patient Registered", `${formData.name} added to patient CRM.`, "success");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove patient profile for ${name}?`)) {
      deleteContact(id);
      showToast("Patient Removed", `${name} record deleted.`, "info");
    }
  };

  const columns: Column<Contact>[] = [
    {
      header: "Patient Name",
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
      header: "Dermatological Profile",
      cell: (c) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-200">
            <span className="text-clinic-400 font-semibold">Skin:</span> {c.skinType}
          </p>
          {c.allergies && c.allergies !== "None" && (
            <p className="text-[11px] text-rose-400">
              <span className="font-semibold">Allergies:</span> {c.allergies}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Clinical Visits",
      accessorKey: "totalVisits",
      sortable: true,
      cell: (c) => (
        <div className="text-xs">
          <p className="font-bold text-white">{c.totalVisits} Consultations</p>
          <p className="text-[10px] text-slate-400">
            Last: {formatDate(c.lastVisit) || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Lifetime Spend",
      accessorKey: "totalSpent",
      sortable: true,
      cell: (c) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(c.totalSpent)}
        </span>
      ),
    },
    {
      header: "Consultation Notes",
      accessorKey: "notes",
      cell: (c) => (
        <span className="text-xs text-slate-400 italic truncate max-w-xs block">
          {c.notes || "No additional notes"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(c)}
            title="Edit Patient"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(c.contactId, c.name)}
            title="Delete Patient"
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
            <ContactIcon className="w-4 h-4" />
            <span>Patient Relationship Management (CRM)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Patient & Customer Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Comprehensive patient histories, skin sensitivities, treatment logs, and lifetime spend.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Contacts Table */}
      <DataTable
        data={contacts}
        columns={columns}
        searchPlaceholder="Search patients by name, phone, email, or notes..."
        searchKey="name"
      />

      {/* Add / Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? "Edit Patient Record" : "Register New Patient Record"}
        subtitle="Record skin characteristics, medical history, and contact details"
        maxWidth="2xl"
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="victoria@beverly.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Skin Type Classification
              </label>
              <select
                value={formData.skinType}
                onChange={(e) =>
                  setFormData({ ...formData, skinType: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
                <option value="Sensitive">Sensitive / Rosacea Prone</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Allergies & Sensitivities
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Latex, Salicylic acid, Aspirin, Fragrance"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Treatment Preferences & Clinical History Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Regular HydraFacial client, prefers morning appointments with Dr. Sheraz Khan."
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
              {editingContact ? "Update Patient Profile" : "Save Patient"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
