"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Appointment, AppointmentStatus } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import {
  Calendar,
  Plus,
  Clock,
  User,
  Sparkle,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function UserAppointmentsPage() {
  const {
    appointments,
    employees,
    treatments,
    contacts,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useData();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    procedureId: treatments[0]?.treatmentId || "",
    procedureName: treatments[0]?.name || "",
    employeeId: employees[0]?.employeeId || "",
    employeeName: employees[0]?.name || "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "10:30",
    status: "scheduled" as AppointmentStatus,
    price: treatments[0]?.price || 300,
    notes: "",
  });

  const handleOpenAdd = () => {
    setEditingApt(null);
    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      procedureId: treatments[0]?.treatmentId || "",
      procedureName: treatments[0]?.name || "",
      employeeId: employees[0]?.employeeId || "",
      employeeName: employees[0]?.name || "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "10:30",
      status: "scheduled",
      price: treatments[0]?.price || 300,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setForm({
      customerName: apt.customerName,
      customerPhone: apt.customerPhone,
      customerEmail: apt.customerEmail || "",
      procedureId: apt.procedureId,
      procedureName: apt.procedureName,
      employeeId: apt.employeeId,
      employeeName: apt.employeeName,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      status: apt.status,
      price: apt.price,
      notes: apt.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleProcedureChange = (trtId: string) => {
    const trt = treatments.find((t) => t.treatmentId === trtId);
    if (trt) {
      setForm((prev) => ({
        ...prev,
        procedureId: trt.treatmentId,
        procedureName: trt.name,
        price: trt.price,
      }));
    }
  };

  const handleDoctorChange = (empId: string) => {
    const emp = employees.find((e) => e.employeeId === empId);
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      showToast("Missing Fields", "Please enter patient name and contact phone.", "warning");
      return;
    }

    if (editingApt) {
      updateAppointment(editingApt.appointmentId, form);
      showToast("Appointment Updated", `Booking for ${form.customerName} updated.`, "success");
    } else {
      addAppointment({
        ...form,
        createdBy: "Isabella Rossi (Reception)",
      });
      showToast(
        "Appointment Confirmed",
        `Scheduled ${form.procedureName} for ${form.customerName} on ${formatDate(form.appointmentDate)}.`,
        "success"
      );
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = (aptId: string, status: AppointmentStatus) => {
    updateAppointment(aptId, { status });
    showToast("Status Updated", `Appointment marked as ${status.toUpperCase()}.`, "info");
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Cancel and remove appointment for ${name}?`)) {
      deleteAppointment(id);
      showToast("Appointment Cancelled", `Booking for ${name} removed.`, "info");
    }
  };

  const columns: Column<Appointment>[] = [
    {
      header: "Patient",
      accessorKey: "customerName",
      sortable: true,
      cell: (apt) => (
        <div>
          <p className="font-bold text-white text-xs">{apt.customerName}</p>
          <p className="text-[11px] text-slate-400">{apt.customerPhone}</p>
        </div>
      ),
    },
    {
      header: "Procedure Description",
      accessorKey: "procedureName",
      sortable: true,
      cell: (apt) => (
        <div>
          <p className="font-semibold text-emerald-300 text-xs">{apt.procedureName}</p>
          <p className="text-[10px] text-slate-400 font-mono">
            Rate: {formatCurrency(apt.price)}
          </p>
        </div>
      ),
    },
    {
      header: "Assigned Staff",
      accessorKey: "employeeName",
      sortable: true,
      cell: (apt) => (
        <span className="font-medium text-slate-200 text-xs">{apt.employeeName}</span>
      ),
    },
    {
      header: "Date & Time",
      accessorKey: "appointmentDate",
      sortable: true,
      cell: (apt) => (
        <div className="text-xs">
          <p className="font-semibold text-white">{formatDate(apt.appointmentDate)}</p>
          <p className="text-emerald-400 text-[11px] font-mono mt-0.5">
            {formatTime(apt.appointmentTime)}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (apt) => (
        <select
          value={apt.status}
          onChange={(e) =>
            handleStatusChange(apt.appointmentId, e.target.value as AppointmentStatus)
          }
          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold capitalize text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In-Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      header: "Actions",
      cell: (apt) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(apt)}
            title="Edit Booking"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(apt.appointmentId, apt.customerName)}
            title="Cancel Booking"
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
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Calendar className="w-4 h-4" />
            <span>Reception Booking Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Book & Manage Appointments
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Schedule consultations, assign doctors, and update patient appointment statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment Booking</span>
        </button>
      </div>

      {/* Appointments Table */}
      <DataTable
        data={appointments}
        columns={columns}
        searchPlaceholder="Search bookings by patient name or procedure..."
        searchKey="customerName"
      />

      {/* Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingApt ? "Edit Booking Details" : "Book Clinical Appointment"}
        subtitle="Select procedure, physician, and preferred consultation timing"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Patient Name
              </label>
              <input
                type="text"
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. Julian Montgomery"
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
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Selected Procedure
              </label>
              <select
                value={form.procedureId}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              >
                {treatments.map((t) => (
                  <option key={t.treatmentId} value={t.treatmentId}>
                    {t.name} — Rs. {t.price} ({t.duration} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Assigned Staff / Doctor
              </label>
              <select
                value={form.employeeId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              >
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} — {e.designation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                required
                value={form.appointmentDate}
                onChange={(e) =>
                  setForm({ ...form, appointmentDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Time Slot
              </label>
              <input
                type="time"
                required
                value={form.appointmentTime}
                onChange={(e) =>
                  setForm({ ...form, appointmentTime: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Reception Notes
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. VIP patient, requests room 2"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
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
              {editingApt ? "Update Booking" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
