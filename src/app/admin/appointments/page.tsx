"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
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
  CheckCircle2,
  XCircle,
  Filter,
  Layers,
  Edit2,
  Trash2,
} from "lucide-react";

export default function AdminAppointmentsPage() {
  const { user } = useAuth();
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
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    procedureId: treatments[0]?.treatmentId || "",
    procedureName: treatments[0]?.name || "",
    employeeId: employees[0]?.employeeId || "",
    employeeName: employees[0]?.name || "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "11:00",
    status: "scheduled" as AppointmentStatus,
    price: treatments[0]?.price || 300,
    notes: "",
  });

  const handleOpenAddModal = () => {
    setEditingApt(null);
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      procedureId: treatments[0]?.treatmentId || "",
      procedureName: treatments[0]?.name || "",
      employeeId: employees[0]?.employeeId || "",
      employeeName: employees[0]?.name || "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "11:00",
      status: "scheduled",
      price: treatments[0]?.price || 300,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setFormData({
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
      setFormData((prev) => ({
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
      setFormData((prev) => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      showToast("Missing Fields", "Please enter patient name and contact phone.", "warning");
      return;
    }

    if (editingApt) {
      updateAppointment(editingApt.appointmentId, formData);
      showToast("Appointment Updated", `Booking for ${formData.customerName} updated.`, "success");
    } else {
      addAppointment({
        ...formData,
        createdBy: user?.displayName || "Sheraz khan",
      });
      showToast(
        "Appointment Booked",
        `Scheduled ${formData.procedureName} for ${formData.customerName} on ${formatDate(formData.appointmentDate)}.`,
        "success"
      );
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = (aptId: string, status: AppointmentStatus) => {
    updateAppointment(aptId, { status });
    showToast("Status Updated", `Appointment status marked as ${status.toUpperCase()}.`, "info");
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Cancel and delete appointment for ${name}?`)) {
      deleteAppointment(id);
      showToast("Appointment Removed", `Booking for ${name} deleted.`, "info");
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchDoc =
        selectedDoctorFilter === "ALL" || a.employeeId === selectedDoctorFilter;
      const matchStatus =
        selectedStatusFilter === "ALL" || a.status === selectedStatusFilter;
      return matchDoc && matchStatus;
    });
  }, [appointments, selectedDoctorFilter, selectedStatusFilter]);

  const columns: Column<Appointment>[] = [
    {
      header: "Patient / Contact",
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
      header: "Procedure & Duration",
      accessorKey: "procedureName",
      sortable: true,
      cell: (apt) => (
        <div>
          <p className="font-semibold text-clinic-300 text-xs">{apt.procedureName}</p>
          <p className="text-[10px] text-slate-400 font-mono">
            Est. Price: {formatCurrency(apt.price)}
          </p>
        </div>
      ),
    },
    {
      header: "Physician / Aesthetician",
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
          <div className="flex items-center gap-1 text-clinic-400 text-[11px] font-mono mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{formatTime(apt.appointmentTime)}</span>
          </div>
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
          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold capitalize text-white focus:border-clinic-500 focus:outline-none"
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
            onClick={() => handleOpenEditModal(apt)}
            title="Edit Booking"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(apt.appointmentId, apt.customerName)}
            title="Cancel & Delete"
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
            <Calendar className="w-4 h-4" />
            <span>Clinical Scheduling & Consultations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Master Appointment Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Real-time consultation calendar, patient treatment bookings, and physician schedules.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <User className="w-4 h-4 text-clinic-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Assigned Physician:
            </span>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-clinic-500 focus:outline-none"
            >
              <option value="ALL">All Physicians & Staff</option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-dark-card/90 border border-slate-700/80 rounded-2xl">
          <Filter className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              Filter by Status:
            </span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-clinic-500 focus:outline-none capitalize"
            >
              <option value="ALL">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In-Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <DataTable
        data={filteredAppointments}
        columns={columns}
        searchPlaceholder="Search bookings by patient name, procedure, or phone..."
        searchKey="customerName"
      />

      {/* Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingApt ? "Edit Appointment Booking" : "Schedule New Clinical Appointment"}
        subtitle="Select patient, treatment procedure, assigned doctor, and timing"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Patient Full Name
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Treatment Procedure
              </label>
              <select
                value={formData.procedureId}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
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
                Assigned Physician / Aesthetician
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
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
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Time Slot
              </label>
              <input
                type="time"
                required
                value={formData.appointmentTime}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentTime: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Consultation / Pre-treatment Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Pre-numbing cream required 30 mins prior, first session"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
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
              {editingApt ? "Update Booking" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
