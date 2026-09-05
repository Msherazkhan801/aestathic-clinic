# SHEZI AESTHETICS — Clinical Management System

A comprehensive, multi-tier management system for aesthetic medicine clinics built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, **jsPDF**, and **Firebase** (Authentication, Firestore, Cloud Storage).

---

## 🚀 Key Features

### 1. Multi-Tier Role-Based Portals
- **🛡️ Admin Portal (`/admin`)**:
  - Full clinical and operational oversight.
  - Staff & User Management: Create and provision **Managers**, **Receptionists (Users)**, and **Admins**.
  - Executive Financial Analytics (Income by Procedure vs Operating Expenses with date range filters).
  - Automated Absence Deduction Payroll Calculation & Approval.
  - Master Appointment Calendar & Doctor Allocation.
  - Cosmeceutical Pharmacy Stock & Low-Threshold Alerts.
  - Clinical Treatment Menu & Pricing Management.
  - Patient CRM with skin analysis and medical history.
  - Audit-ready Executive PDF & CSV Report Generator.
  - Clinic Branding, Tax, and Operating Hours Configuration.

- **💼 Manager Portal (`/manager`)**:
  - Daily Staff Attendance Marking (`Present`, `Absent`, `Leave`, `Half-Day`).
  - Attendance Absence Salary Calculator.
  - Staff Shift Hours Schedule.
  - Cashier Sales & Operating Expenses Ledger.
  - Financial Performance PDF/CSV Reporting.
  - View-only Directory for Appointments, Treatments, and Pharmacy.

- **👤 User / Receptionist Portal (`/user`)**:
  - Interactive Patient Appointment Booking & Doctor Assignment.
  - Patient Directory CRM.
  - Treatment Price Lookups & Service Menus.
  - Pharmacy Dispensary & 1-Click Stock Adjustments.

---

## 🔑 Default Fixed Credentials

| Portal Role | Work Email (Login ID) | Password | Access Permissions |
|---|---|---|---|
| **🛡️ Admin** | `sherazkhan@admin.com` | `admin@321` | Full clinical control, user & manager creation, P&L reports, payroll approval, settings |
| **💼 Manager** | `salar@gmail.com` | `manager123` | Daily attendance marking, shift schedules, cashflow ledger, salary calculation |
| **👤 User (Reception)** | `user@gmail.com` | `user123` | Appointment booking, patient CRM directory, treatment price lookups, pharmacy dispensary |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Data Visualization**: Recharts (Area & Donut Charts)
- **Document Export**: jsPDF & jsPDF-AutoTable (Invoices, Payslips, Financial Statements)
- **Backend / Database**: Firebase (Auth, Firestore, Storage) with Offline Local Sync

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 📄 License
Private & Confidential — SHEZI AESTHETICS.
