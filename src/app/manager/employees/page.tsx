"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Employee, Designation } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Users, Edit2, Clock, Briefcase, Phone, Mail } from "lucide-react";

const DESIGNATIONS: Designation[] = [
  "Lead Aesthetic Physician",
  "Cosmetic Dermatologist",
  "Senior Aesthetician",
  "Laser & Skin Specialist",
  "Clinic Manager",
  "Front Desk Receptionist",
  "Customer Care Executive",
  "Registered Aesthetic Nurse",
];

export default function ManagerEmployeesPage() {
  const { employees, updateEmployee } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    designation: "Senior Aesthetician" as Designation,
    shiftStart: "09:00",
    shiftEnd: "17:30",
    phone: "",
    specialization: "",
  });

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setForm({
      designation: emp.designation,
      shiftStart: emp.shiftStart,
      shiftEnd: emp.shiftEnd,
      phone: emp.phone,
      specialization: emp.specialization || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      updateEmployee(editingEmp.employeeId, form);
      showToast(
        "Staff Schedule Updated",
        `Updated shift timings and role for ${editingEmp.name}.`,
        "success"
      );
      setIsModalOpen(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: "Staff Member",
      accessorKey: "name",
      sortable: true,
      cell: (emp) => (
        <div>
          <p className="font-bold text-white text-xs">{emp.name}</p>
          <p className="text-[11px] text-slate-400">{emp.email}</p>
        </div>
      ),
    },
    {
      header: "Designation",
      accessorKey: "designation",
      sortable: true,
      cell: (emp) => (
        <div>
          <span className="font-semibold text-amber-300 text-xs">{emp.designation}</span>
          {emp.specialization && (
            <p className="text-[10px] text-slate-400 font-light truncate max-w-xs">
              {emp.specialization}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Duty Shift Hours",
      accessorKey: "shiftStart",
      sortable: true,
      cell: (emp) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {emp.shiftStart} — {emp.shiftEnd}
          </span>
        </div>
      ),
    },
    {
      header: "Contact Phone",
      accessorKey: "phone",
      cell: (emp) => <span className="text-xs text-slate-300">{emp.phone}</span>,
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (emp) => <StatusBadge status={emp.isActive ? "active" : "inactive"} />,
    },
    {
      header: "Actions",
      cell: (emp) => (
        <button
          onClick={() => handleOpenEdit(emp)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Edit Shift</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Briefcase className="w-4 h-4" />
          <span>Staff Scheduling & Shift Allocations</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Staff Shift Timings & Designations
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
          Modify clinical duty shifts, work schedules, and staff role designations.
        </p>
      </div>

      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="Search staff roster..."
        searchKey="name"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Shift Schedule: ${editingEmp?.name}`}
        subtitle="Update duty hours and role designation"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Role Designation
            </label>
            <select
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value as Designation })
              }
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Shift Starts
              </label>
              <input
                type="time"
                value={form.shiftStart}
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Shift Ends
              </label>
              <input
                type="time"
                value={form.shiftEnd}
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Specialization
            </label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-white font-bold shadow-lg transition-all"
            >
              Update Staff Shift
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
