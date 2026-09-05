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
  UserCheck,
  Briefcase,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Layers,
  Lock,
  Mail,
  Phone,
  Clock,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Search,
  CheckCircle2,
  RefreshCw,
  UserPlus,
} from "lucide-react";

const DESIGNATION_OPTIONS: Designation[] = [
  "Clinic Manager",
  "Front Desk Receptionist",
  "Customer Care Executive",
  "Senior Aesthetician",
  "Laser & Skin Specialist",
  "Lead Aesthetic Physician",
  "Cosmetic Dermatologist",
  "Registered Aesthetic Nurse",
];

interface BulkUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  designation: Designation;
  salary: number;
}

export default function AdminUsersManagementPage() {
  const { employees, addEmployee, addMultipleEmployees, updateEmployee, deleteEmployee, settings } = useData();
  const { showToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState<Employee | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Visible passwords map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Single Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as UserRole,
    password: "",
    designation: "Front Desk Receptionist" as Designation,
    salary: 3500,
    shiftStart: "09:00",
    shiftEnd: "17:30",
    joiningDate: new Date().toISOString().split("T")[0],
    isActive: true,
    specialization: "",
  });

  // Bulk Rows State
  const [bulkRows, setBulkRows] = useState<BulkUserRow[]>([
    {
      id: "row-1",
      name: "",
      email: "",
      role: "user",
      password: "user123",
      designation: "Front Desk Receptionist",
      salary: 3500,
    },
    {
      id: "row-2",
      name: "",
      email: "",
      role: "manager",
      password: "manager123",
      designation: "Clinic Manager",
      salary: 5500,
    },
  ]);

  // Counts
  const adminCount = useMemo(() => employees.filter((e) => e.role === "admin").length, [employees]);
  const managerCount = useMemo(() => employees.filter((e) => e.role === "manager").length, [employees]);
  const userCount = useMemo(() => employees.filter((e) => e.role === "user").length, [employees]);

  // Filtered employees list
  const filteredUsers = useMemo(() => {
    return employees.filter((emp) => {
      const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
      const matchesSearch =
        searchTerm === "" ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchTerm));
      return matchesRole && matchesSearch;
    });
  }, [employees, roleFilter, searchTerm]);

  // Generate random password helper
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // Open Single Create Modal
  const handleOpenAddModal = (presetRole: UserRole = "user") => {
    setEditingEmployee(null);
    const autoPass = presetRole === "manager" ? "manager123" : "user123";
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: presetRole,
      password: autoPass,
      designation:
        presetRole === "manager"
          ? "Clinic Manager"
          : presetRole === "admin"
          ? "Lead Aesthetic Physician"
          : "Front Desk Receptionist",
      salary: presetRole === "manager" ? 5500 : presetRole === "admin" ? 9500 : 3500,
      shiftStart: "09:00",
      shiftEnd: "17:30",
      joiningDate: new Date().toISOString().split("T")[0],
      isActive: true,
      specialization: "",
    });
    setIsSingleModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role || "user",
      password: emp.password || (emp.role === "manager" ? "manager123" : "user123"),
      designation: emp.designation,
      salary: emp.salary,
      shiftStart: emp.shiftStart,
      shiftEnd: emp.shiftEnd,
      joiningDate: emp.joiningDate,
      isActive: emp.isActive,
      specialization: emp.specialization || "",
    });
    setIsSingleModalOpen(true);
  };

  // Submit Single Form
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast("Missing Fields", "Please enter account name and email address.", "warning");
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.employeeId, formData);
      showToast(
        "Account Updated",
        `Profile and portal permissions updated for ${formData.name}.`,
        "success"
      );
    } else {
      addEmployee(formData);
      showToast(
        "New Account Created",
        `Created ${formData.role.toUpperCase()} login for ${formData.name} (${formData.email}).`,
        "success"
      );
    }
    setIsSingleModalOpen(false);
  };

  // Open Password Reset Modal
  const handleOpenResetPassModal = (emp: Employee) => {
    setSelectedUserForPass(emp);
    setNewPasswordInput(emp.password || (emp.role === "manager" ? "manager123" : "user123"));
    setIsResetPassModalOpen(true);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPass) return;
    if (!newPasswordInput.trim()) {
      showToast("Invalid Password", "Password cannot be empty.", "warning");
      return;
    }
    updateEmployee(selectedUserForPass.employeeId, { password: newPasswordInput.trim() });
    showToast(
      "Password Updated",
      `New login password set for ${selectedUserForPass.name}.`,
      "success"
    );
    setIsResetPassModalOpen(false);
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy Credentials
  const copyCredentials = (emp: Employee) => {
    const pass = emp.password || (emp.role === "manager" ? "manager123" : "user123");
    const text = `SHEZI AESTHETICS PORTAL ACCESS\nRole: ${emp.role.toUpperCase()}\nEmail: ${emp.email}\nPassword: ${pass}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(emp.employeeId);
    showToast("Credentials Copied", `Copied login details for ${emp.name} to clipboard.`, "info");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Delete User
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the user account for "${name}"? They will no longer be able to log in.`)) {
      deleteEmployee(id);
      showToast("Account Removed", `${name}'s account has been removed.`, "info");
    }
  };

  // Toggle Active Status
  const toggleActiveStatus = (emp: Employee) => {
    const nextStatus = !emp.isActive;
    updateEmployee(emp.employeeId, { isActive: nextStatus });
    showToast(
      nextStatus ? "Account Activated" : "Account Suspended",
      `${emp.name} is now ${nextStatus ? "active" : "suspended"}.`,
      nextStatus ? "success" : "warning"
    );
  };

  // ================= Bulk Creation Logic =================
  const handleAddBulkRow = () => {
    const newId = `row-${Date.now()}`;
    setBulkRows((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        email: "",
        role: "user",
        password: "user123",
        designation: "Front Desk Receptionist",
        salary: 3500,
      },
    ]);
  };

  const handleRemoveBulkRow = (id: string) => {
    if (bulkRows.length <= 1) {
      showToast("Cannot Remove", "Keep at least one user row.", "warning");
      return;
    }
    setBulkRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateBulkRow = (id: string, field: keyof BulkUserRow, value: any) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "role") {
          if (value === "manager") {
            updated.designation = "Clinic Manager";
            updated.password = "manager123";
            updated.salary = 5500;
          } else {
            updated.designation = "Front Desk Receptionist";
            updated.password = "user123";
            updated.salary = 3500;
          }
        }
        return updated;
      })
    );
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter((r) => r.name.trim() && r.email.trim());

    if (validRows.length === 0) {
      showToast("No Valid Accounts", "Please enter at least one user with name and email.", "warning");
      return;
    }

    const payload: Omit<Employee, "employeeId">[] = validRows.map((r) => ({
      name: r.name.trim(),
      email: r.email.trim().toLowerCase(),
      phone: "+92 300 0000000",
      role: r.role,
      password: r.password.trim() || (r.role === "manager" ? "manager123" : "user123"),
      designation: r.designation,
      salary: Number(r.salary) || 3500,
      shiftStart: "09:00",
      shiftEnd: "17:30",
      joiningDate: new Date().toISOString().split("T")[0],
      isActive: true,
    }));

    addMultipleEmployees(payload);
    showToast(
      "Bulk Creation Complete",
      `Successfully created ${payload.length} new Manager/User account(s)!`,
      "success"
    );

    // Reset bulk form
    setBulkRows([
      {
        id: "row-1",
        name: "",
        email: "",
        role: "user",
        password: "user123",
        designation: "Front Desk Receptionist",
        salary: 3500,
      },
    ]);
    setIsBulkModalOpen(false);
  };

  // Table Columns
  const columns: Column<Employee>[] = [
    {
      header: "User / Account",
      accessorKey: "name",
      sortable: true,
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border flex-shrink-0 shadow-sm ${
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
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-white text-sm">{emp.name}</p>
              {!emp.isActive && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-semibold">
                  Suspended
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>{emp.email}</span>
            </p>
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin (Full Oversight)</span>
            </span>
          );
        }
        if (role === "manager") {
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Manager (Finance & HR)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(16,185,129,0.2)]">
            <UserCheck className="w-3.5 h-3.5" />
            <span>User (Reception & Care)</span>
          </span>
        );
      },
    },
    {
      header: "Designation",
      accessorKey: "designation",
      sortable: true,
      cell: (emp) => (
        <div>
          <p className="font-medium text-slate-200 text-xs">{emp.designation}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {formatCurrency(emp.salary)}/mo
          </p>
        </div>
      ),
    },
    {
      header: "Login Password",
      accessorKey: "password",
      cell: (emp) => {
        const pass = emp.password || (emp.role === "manager" ? "manager123" : emp.role === "admin" ? "admin123" : "user123");
        const isVisible = visiblePasswords[emp.employeeId];
        return (
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 min-w-[80px]">
              {isVisible ? pass : "••••••••"}
            </div>
            <button
              onClick={() => togglePasswordVisibility(emp.employeeId)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isVisible ? "Hide Password" : "Show Password"}
            >
              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleOpenResetPassModal(emp)}
              className="p-1 rounded text-clinic-400 hover:text-clinic-300 hover:bg-slate-800 transition-colors"
              title="Reset Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => copyCredentials(emp)}
              className="p-1 rounded text-gold-400 hover:text-gold-300 hover:bg-slate-800 transition-colors"
              title="Copy Login Credentials"
            >
              {copiedId === emp.employeeId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (emp) => (
        <button
          onClick={() => toggleActiveStatus(emp)}
          className="focus:outline-none transition-transform hover:scale-105"
          title={`Click to ${emp.isActive ? "Suspend" : "Activate"} account`}
        >
          <StatusBadge status={emp.isActive ? "active" : "inactive"} />
        </button>
      ),
    },
    {
      header: "Actions",
      accessorKey: "employeeId",
      cell: (emp) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => handleOpenEditModal(emp)}
            title="Edit User & Permissions"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {emp.role !== "admin" && (
            <button
              onClick={() => handleDelete(emp.employeeId, emp.name)}
              title="Delete Account"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Control Panel • Portal User Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display flex items-center gap-2">
            <span>User & Manager Accounts</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5 max-w-2xl">
            Create single or multiple accounts for <strong>Managers</strong> (Finance, HR, Salaries) and <strong>Users</strong> (Reception, Bookings, Pharmacy).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleOpenAddModal("user")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create User</span>
          </button>

          <button
            onClick={() => handleOpenAddModal("manager")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ Create Manager</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all active:scale-95"
          >
            <Layers className="w-4 h-4" />
            <span>+ Bulk Create Accounts</span>
          </button>
        </div>
      </div>

      {/* Role Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div
          onClick={() => setRoleFilter("ALL")}
          className={`cursor-pointer p-4 rounded-3xl border transition-all ${
            roleFilter === "ALL"
              ? "bg-clinic-500/15 border-clinic-500/60 shadow-glow"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Accounts</span>
            <Users className="w-4 h-4 text-clinic-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2 font-mono">{employees.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">All active & demo users</p>
        </div>

        {/* Managers */}
        <div
          onClick={() => setRoleFilter("manager")}
          className={`cursor-pointer p-4 rounded-3xl border transition-all ${
            roleFilter === "manager"
              ? "bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold">Managers</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">{managerCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Finance & HR control access</p>
        </div>

        {/* Users (Reception) */}
        <div
          onClick={() => setRoleFilter("user")}
          className={`cursor-pointer p-4 rounded-3xl border transition-all ${
            roleFilter === "user"
              ? "bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-semibold">Users (Reception)</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{userCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Appointments & care access</p>
        </div>

        {/* Administrator */}
        <div
          onClick={() => setRoleFilter("admin")}
          className={`cursor-pointer p-4 rounded-3xl border transition-all ${
            roleFilter === "admin"
              ? "bg-rose-500/15 border-rose-500/60 shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]"
              : "bg-dark-card/90 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-semibold">Administrators</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">{adminCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Full system director access</p>
        </div>
      </div>

      {/* Role Quick Reference Box */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-4.5 text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-amber-300">Manager Access Powers</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Sales, Expenses, Daily Attendance, Salary Calculation, Financial Reports, and Clinic Directory.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-300">User (Reception) Powers</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Book Appointments, Patient Directory, Treatment Price List, Pharmacy Stock & Dispensing.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-rose-300">Admin Exclusive Powers</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Create/Manage Users & Managers, Full Analytics, System Configuration, Seed Reset, and Clinical Doctors.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-clinic-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Accounts" },
            { id: "manager", label: "Managers" },
            { id: "user", label: "Users" },
            { id: "admin", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === tab.id
                  ? "bg-clinic-500 text-white shadow-glow"
                  : "bg-dark-card text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark">
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchPlaceholder="Filter table records..."
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. SINGLE USER / MANAGER CREATION OR EDIT MODAL                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title={
          editingEmployee
            ? `Edit Account: ${editingEmployee.name}`
            : `Create New ${formData.role === "manager" ? "Manager" : formData.role === "admin" ? "Admin" : "User"} Account`
        }
      >
        <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
          {/* Role Picker */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Portal Access Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "user", designation: "Front Desk Receptionist" })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  formData.role === "user"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <UserCheck className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span>User (Reception)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "manager", designation: "Clinic Manager", salary: 5500 })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  formData.role === "manager"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Briefcase className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <span>Manager (HR & Finance)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "admin" })}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  formData.role === "admin"
                    ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md font-bold"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                <span>Admin (Full Oversight)</span>
              </button>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sara Khan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Login Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. sara@sheziaesthetics.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password & Generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Login Password *
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                className="text-[11px] text-clinic-400 hover:text-clinic-300 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate Password</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. user123 or strongpass"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Official Job Designation
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value as Designation })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              >
                {DESIGNATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary & Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Monthly Salary ({settings.currencySymbol || "Rs."})
              </label>
              <input
                type="number"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Shift Start
              </label>
              <input
                type="time"
                value={formData.shiftStart}
                onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Shift End
              </label>
              <input
                type="time"
                value={formData.shiftEnd}
                onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveSingle"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-clinic-500 bg-slate-900 border-slate-700 focus:ring-0"
            />
            <label htmlFor="isActiveSingle" className="text-slate-300 font-medium cursor-pointer">
              Account is Active and allowed to log in
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSingleModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold shadow-glow"
            >
              {editingEmployee ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. BULK / MULTI-USER CREATION MODAL                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Create Multiple Users & Managers"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
          <p className="text-slate-400 text-xs">
            Add multiple staff accounts in one go. Choose the role for each row and enter their details. They will be immediately registered and ready to log in!
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {bulkRows.map((row, index) => (
              <div
                key={row.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-clinic-500/20 text-clinic-300 flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span>Account #{index + 1}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Role selector pill */}
                    <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleUpdateBulkRow(row.id, "role", "user")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          row.role === "user"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        User
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBulkRow(row.id, "role", "manager")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          row.role === "manager"
                            ? "bg-amber-500 text-slate-900 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Manager
                      </button>
                    </div>

                    {bulkRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBulkRow(row.id)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ayesha Malik"
                      value={row.name}
                      onChange={(e) => handleUpdateBulkRow(row.id, "name", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ayesha@sheziaesthetics.com"
                      value={row.email}
                      onChange={(e) => handleUpdateBulkRow(row.id, "email", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Password</label>
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={row.password}
                      onChange={(e) => handleUpdateBulkRow(row.id, "password", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-clinic-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Designation</label>
                    <select
                      value={row.designation}
                      onChange={(e) => handleUpdateBulkRow(row.id, "designation", e.target.value as Designation)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
                    >
                      {DESIGNATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Monthly Salary ({settings.currencySymbol || "Rs."})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={row.salary}
                      onChange={(e) => handleUpdateBulkRow(row.id, "salary", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-clinic-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddBulkRow}
            className="w-full py-2.5 rounded-xl border border-dashed border-clinic-500/50 bg-clinic-500/5 hover:bg-clinic-500/10 text-clinic-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Another User / Manager Row</span>
          </button>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold shadow-glow flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create All {bulkRows.length} Accounts</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. RESET PASSWORD MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        title={`Reset Password: ${selectedUserForPass?.name || "User"}`}
      >
        <form onSubmit={handleSaveResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-400 text-xs">
            Enter a new login password for <strong>{selectedUserForPass?.email}</strong>.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">New Password</label>
              <button
                type="button"
                onClick={() => setNewPasswordInput(generateRandomPassword())}
                className="text-[11px] text-clinic-400 hover:text-clinic-300 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetPassModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-clinic-500 hover:bg-clinic-600 text-white font-bold shadow-glow"
            >
              Save New Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
