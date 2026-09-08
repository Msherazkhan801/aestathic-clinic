"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Employee, Designation, UserRole } from "@/types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  Filter,
  QrCode,
  Printer,
} from "lucide-react";
import { EmployeeQrBadge } from "@/components/attendance/EmployeeQrBadge";

const DESIGNATION_OPTIONS: Designation[] = [
  "Lead Aesthetic Physician",
  "Cosmetic Dermatologist",
  "Senior Aesthetician",
  "Laser & Skin Specialist",
  "Clinic Manager",
  "Front Desk Receptionist",
  "Customer Care Executive",
  "Registered Aesthetic Nurse",
];

export default function AdminEmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const { showToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingQrEmployee, setViewingQrEmployee] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as UserRole,
    password: "",
    designation: "Senior Aesthetician" as Designation,
    salary: 4500,
    shiftStart: "09:00",
    shiftEnd: "17:30",
    joiningDate: new Date().toISOString().split("T")[0],
    isActive: true,
    specialization: "",
  });

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (roleFilter === "ALL") return employees;
    return employees.filter((emp) => emp.role === roleFilter);
  }, [employees, roleFilter]);

  // Counts
  const adminCount = employees.filter((e) => e.role === "admin").length;
  const managerCount = employees.filter((e) => e.role === "manager").length;
  const userCount = employees.filter((e) => e.role === "user").length;

  const handleOpenAddModal = (presetRole: UserRole = "user") => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: presetRole,
      password: "",
      designation:
        presetRole === "manager"
          ? "Clinic Manager"
          : presetRole === "admin"
          ? "Lead Aesthetic Physician"
          : "Front Desk Receptionist",
      salary: presetRole === "manager" ? 5800 : presetRole === "admin" ? 9500 : 3500,
      shiftStart: "09:00",
      shiftEnd: "17:30",
      joiningDate: new Date().toISOString().split("T")[0],
      isActive: true,
      specialization: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role || "user",
      password: emp.password || "",
      designation: emp.designation,
      salary: emp.salary,
      shiftStart: emp.shiftStart,
      shiftEnd: emp.shiftEnd,
      joiningDate: emp.joiningDate,
      isActive: emp.isActive,
      specialization: emp.specialization || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast("Missing Fields", "Please enter staff name and email.", "warning");
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.employeeId, formData);
      showToast(
        "Staff Profile Updated",
        `${formData.name} updated as ${formData.role.toUpperCase()}.`,
        "success"
      );
    } else {
      addEmployee(formData);
      showToast(
        "User Created Successfully",
        `Created new ${formData.role.toUpperCase()} account for ${formData.name}.`,
        "success"
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the staff and user directory?`)) {
      deleteEmployee(id);
      showToast("Staff Member Removed", `${name} was removed.`, "info");
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: "Staff Member",
      accessorKey: "name",
      sortable: true,
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs border flex-shrink-0 ${
              emp.role === "admin"
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : emp.role === "manager"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            }`}
          >
            {emp.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{emp.name}</p>
            <p className="text-slate-400 text-xs">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Portal Access Role",
      accessorKey: "role",
      sortable: true,
      cell: (emp) => {
        const role = emp.role || "user";
        if (role === "admin") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </span>
          );
        }
        if (role === "manager") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Manager</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            <span>User (Reception)</span>
          </span>
        );
      },
    },
    {
      header: "Designation & Focus",
      accessorKey: "designation",
      sortable: true,
      cell: (emp) => (
        <div>
          <span className="font-semibold text-slate-200">{emp.designation}</span>
          {emp.specialization && (
            <p className="text-[11px] text-clinic-300 font-light truncate max-w-xs">
              {emp.specialization}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Shift Hours",
      accessorKey: "shiftStart",
      cell: (emp) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-clinic-400" />
          <span>
            {emp.shiftStart} — {emp.shiftEnd}
          </span>
        </div>
      ),
    },
    {
      header: "Base Salary",
      accessorKey: "salary",
      sortable: true,
      cell: (emp) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCurrency(emp.salary)}
          <span className="text-[10px] text-slate-400 font-normal">/mo</span>
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (emp) => (
        <StatusBadge status={emp.isActive ? "active" : "inactive"} />
      ),
    },
    {
      header: "Actions",
      cell: (emp) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingQrEmployee(emp);
            }}
            title="View & Print Staff QR Badge"
            className="p-1.5 rounded-lg bg-clinic-500/10 hover:bg-clinic-500/20 text-clinic-400 hover:text-clinic-300 transition-colors"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditModal(emp);
            }}
            title="Edit Profile & Role"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(emp.employeeId, emp.name);
            }}
            title="Delete Staff Member"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>Staff & User Access Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Users & Staff Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
            Admin portal control: Create and provision accounts for <strong>Managers</strong>, <strong>Users (Receptionists)</strong>, and <strong>Admins</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAddModal("user")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ New User</span>
          </button>
          <button
            onClick={() => handleOpenAddModal("manager")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ New Manager</span>
          </button>
          <button
            onClick={() => handleOpenAddModal("admin")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setRoleFilter("ALL")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            roleFilter === "ALL"
              ? "bg-clinic-500/15 border-clinic-500/60 shadow-glow"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">All Personnel</span>
            <Users className="w-4 h-4 text-clinic-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-mono">{employees.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total registered accounts</p>
        </div>

        <div
          onClick={() => setRoleFilter("manager")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            roleFilter === "manager"
              ? "bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Managers</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">{managerCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Finance & HR controllers</p>
        </div>

        <div
          onClick={() => setRoleFilter("user")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            roleFilter === "user"
              ? "bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Users / Reception</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{userCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Front desk & patient care</p>
        </div>

        <div
          onClick={() => setRoleFilter("admin")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            roleFilter === "admin"
              ? "bg-rose-500/15 border-rose-500/60 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">Admins</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">{adminCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Full clinical directors</p>
        </div>
      </div>

      {/* Employees Table */}
      <DataTable
        data={filteredEmployees}
        columns={columns}
        searchPlaceholder="Search staff by name, designation, or specialization..."
        searchKey="name"
        emptyMessage={
          roleFilter === "ALL"
            ? "No staff members found."
            : `No staff found with role ${roleFilter.toUpperCase()}. Click 'Add New Staff' to create one.`
        }
      />

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Edit Staff & User Profile" : "Create New User / Staff Account"}
        subtitle="Configure credentials, assign portal access role (User / Manager / Admin), and salary."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* STEP 1: PORTAL ACCESS ROLE SELECTOR */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
              1. Assign System Portal Access Role <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* User Role Card */}
              <div
                onClick={() => setFormData({ ...formData, role: "user" })}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  formData.role === "user"
                    ? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  {formData.role === "user" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">User / Reception</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Book appointments, patient CRM directory, price lookups, and pharmacy dispensing.
                  </p>
                </div>
              </div>

              {/* Manager Role Card */}
              <div
                onClick={() => setFormData({ ...formData, role: "manager" })}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  formData.role === "manager"
                    ? "bg-amber-500/20 border-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {formData.role === "manager" && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Manager</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Mark daily staff attendance, compute absence deductions, shift timings, and sales ledger.
                  </p>
                </div>
              </div>

              {/* Admin Role Card */}
              <div
                onClick={() => setFormData({ ...formData, role: "admin" })}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  formData.role === "admin"
                    ? "bg-rose-500/20 border-rose-500 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  {formData.role === "admin" && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Admin</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Full oversight: staff management, executive financials, salary approvals, and system settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: STAFF & CREDENTIALS INFO */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
              2. Staff Profile & Login Credentials
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name & Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Work Email (Login ID) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@sheziaesthetics.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Initial Password (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. Shezi@2026"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Role Designation</label>
                <select
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value as Designation })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                >
                  {DESIGNATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Base Monthly Salary (Rs.) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Shift Start Time</label>
                <input
                  type="time"
                  value={formData.shiftStart}
                  onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Shift End Time</label>
                <input
                  type="time"
                  value={formData.shiftEnd}
                  onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Clinical Focus / Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Front Desk, Cashier, HydraFacial"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-clinic-500 focus:ring-clinic-500"
              />
              <label htmlFor="isActiveCheck" className="text-slate-300 font-medium">
                Active staff account (authorized to log into system & appear on attendance)
              </label>
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
              {editingEmployee ? "Update User Account" : `Create ${formData.role.toUpperCase()} Account`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Single Employee QR Badge Modal */}
      {viewingQrEmployee && (
        <Modal
          isOpen={!!viewingQrEmployee}
          onClose={() => setViewingQrEmployee(null)}
          title="Staff Digital ID & QR Badge"
          maxWidth="md"
        >
          <div className="py-2">
            <EmployeeQrBadge
              employee={viewingQrEmployee}
              clinicName="SHEZI AESTHETICS"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
