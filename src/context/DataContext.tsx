"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Appointment,
  AttendanceRecord,
  ClinicSettings,
  Contact,
  Employee,
  Expense,
  PharmacyItem,
  SalaryRecord,
  Sale,
  Treatment,
  AttendanceStatus,
  SalaryStatus,
} from "@/types";
import {
  defaultSettings,
  seedAppointments,
  seedAttendance,
  seedContacts,
  seedEmployees,
  seedExpenses,
  seedPharmacy,
  seedSalaries,
  seedSales,
  seedTreatments,
} from "@/lib/seedData";
import { calculateSalaryForEmployee } from "@/lib/salaryCalculator";

interface DataContextType {
  // Settings
  settings: ClinicSettings;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;

  // Employees
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, "employeeId">) => void;
  addMultipleEmployees: (newEmps: Omit<Employee, "employeeId">[]) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Treatments
  treatments: Treatment[];
  addTreatment: (trt: Omit<Treatment, "treatmentId">) => void;
  updateTreatment: (id: string, trt: Partial<Treatment>) => void;
  deleteTreatment: (id: string) => void;

  // Appointments
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, "appointmentId">) => void;
  updateAppointment: (id: string, apt: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Pharmacy
  pharmacy: PharmacyItem[];
  addPharmacyItem: (item: Omit<PharmacyItem, "itemId">) => void;
  updatePharmacyItem: (id: string, item: Partial<PharmacyItem>) => void;
  deletePharmacyItem: (id: string) => void;

  // Sales (Income)
  sales: Sale[];
  addSale: (sale: Omit<Sale, "saleId">) => void;
  deleteSale: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, "expenseId">) => void;
  deleteExpense: (id: string) => void;

  // Attendance
  attendance: AttendanceRecord[];
  markAttendance: (
    employeeId: string,
    status: AttendanceStatus,
    date?: string,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => void;

  // Salaries
  salaries: SalaryRecord[];
  generateMonthlySalaries: (month: string, recordedBy: string) => void;
  updateSalaryStatus: (salaryId: string, status: SalaryStatus) => void;

  // Contacts (Patients)
  contacts: Contact[];
  addContact: (contact: Omit<Contact, "contactId" | "totalVisits" | "totalSpent" | "createdAt">) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Seed Reset
  resetToDefaultSeed: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // States
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [treatments, setTreatments] = useState<Treatment[]>(seedTreatments);
  const [appointments, setAppointments] = useState<Appointment[]>(seedAppointments);
  const [pharmacy, setPharmacy] = useState<PharmacyItem[]>(seedPharmacy);
  const [sales, setSales] = useState<Sale[]>(seedSales);
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(seedAttendance);
  const [salaries, setSalaries] = useState<SalaryRecord[]>(seedSalaries);
  const [contacts, setContacts] = useState<Contact[]>(seedContacts);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem("clinic_settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.currencySymbol === "$" || !parsed.currencySymbol) {
          parsed.currencySymbol = "Rs. ";
        }
        if (parsed.clinicName === "LUMEN AESTHETICS" || !parsed.clinicName) {
          parsed.clinicName = "SHEZI AESTHETICS";
        }
        if (parsed.email && parsed.email.includes("lumenaesthetics.com")) {
          parsed.email = parsed.email.replace("lumenaesthetics.com", "sheziaesthetics.com");
        }
        setSettings(parsed);
      }

      const storedEmployees = localStorage.getItem("clinic_employees");
      if (storedEmployees) {
        const parsed = JSON.parse(storedEmployees);
        const updated = parsed.map((e: any) => ({
          ...e,
          role:
            e.role ||
            (e.designation?.includes("Manager")
              ? "manager"
              : e.designation?.includes("Lead") ||
                e.designation?.includes("Physician") ||
                e.designation?.includes("Doctor") ||
                e.designation?.includes("Dermatologist")
              ? "admin"
              : "user"),
        }));
        setEmployees(updated);
      }

      const storedTreatments = localStorage.getItem("clinic_treatments");
      if (storedTreatments) setTreatments(JSON.parse(storedTreatments));

      const storedAppointments = localStorage.getItem("clinic_appointments");
      if (storedAppointments) setAppointments(JSON.parse(storedAppointments));

      const storedPharmacy = localStorage.getItem("clinic_pharmacy");
      if (storedPharmacy) setPharmacy(JSON.parse(storedPharmacy));

      const storedSales = localStorage.getItem("clinic_sales");
      if (storedSales) setSales(JSON.parse(storedSales));

      const storedExpenses = localStorage.getItem("clinic_expenses");
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedAttendance = localStorage.getItem("clinic_attendance");
      if (storedAttendance) setAttendance(JSON.parse(storedAttendance));

      const storedSalaries = localStorage.getItem("clinic_salaries");
      if (storedSalaries) setSalaries(JSON.parse(storedSalaries));

      const storedContacts = localStorage.getItem("clinic_contacts");
      if (storedContacts) setContacts(JSON.parse(storedContacts));
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
    setIsLoaded(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("clinic_settings", JSON.stringify(settings));
    localStorage.setItem("clinic_employees", JSON.stringify(employees));
    localStorage.setItem("clinic_treatments", JSON.stringify(treatments));
    localStorage.setItem("clinic_appointments", JSON.stringify(appointments));
    localStorage.setItem("clinic_pharmacy", JSON.stringify(pharmacy));
    localStorage.setItem("clinic_sales", JSON.stringify(sales));
    localStorage.setItem("clinic_expenses", JSON.stringify(expenses));
    localStorage.setItem("clinic_attendance", JSON.stringify(attendance));
    localStorage.setItem("clinic_salaries", JSON.stringify(salaries));
    localStorage.setItem("clinic_contacts", JSON.stringify(contacts));
  }, [
    isLoaded,
    settings,
    employees,
    treatments,
    appointments,
    pharmacy,
    sales,
    expenses,
    attendance,
    salaries,
    contacts,
  ]);

  // Reset to seed
  const resetToDefaultSeed = () => {
    setSettings(defaultSettings);
    setEmployees(seedEmployees);
    setTreatments(seedTreatments);
    setAppointments(seedAppointments);
    setPharmacy(seedPharmacy);
    setSales(seedSales);
    setExpenses(seedExpenses);
    setAttendance(seedAttendance);
    setSalaries(seedSalaries);
    setContacts(seedContacts);
  };

  // Settings
  const updateSettings = (newSettings: Partial<ClinicSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Employees
  const addEmployee = (emp: Omit<Employee, "employeeId">) => {
    let currentMax = employees.reduce((max, e) => {
      const num = parseInt(e.employeeId.replace("emp-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, employees.length);

    const newEmp: Employee = {
      ...emp,
      employeeId: `emp-${String(currentMax + 1).padStart(3, "0")}`,
      role: emp.role || "user",
    };
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const addMultipleEmployees = (newEmps: Omit<Employee, "employeeId">[]) => {
    let currentMax = employees.reduce((max, e) => {
      const num = parseInt(e.employeeId.replace("emp-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, employees.length);

    const created: Employee[] = newEmps.map((emp, index) => ({
      ...emp,
      employeeId: `emp-${String(currentMax + index + 1).padStart(3, "0")}`,
      role: emp.role || "user",
    }));

    setEmployees((prev) => [...created, ...prev]);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.employeeId === id ? { ...e, ...updated } : e))
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.employeeId !== id));
  };

  // Treatments
  const addTreatment = (trt: Omit<Treatment, "treatmentId">) => {
    const newTrt: Treatment = {
      ...trt,
      treatmentId: `trt-${String(treatments.length + 1).padStart(3, "0")}`,
    };
    setTreatments((prev) => [newTrt, ...prev]);
  };

  const updateTreatment = (id: string, updated: Partial<Treatment>) => {
    setTreatments((prev) =>
      prev.map((t) => (t.treatmentId === id ? { ...t, ...updated } : t))
    );
  };

  const deleteTreatment = (id: string) => {
    setTreatments((prev) => prev.filter((t) => t.treatmentId !== id));
  };

  // Appointments
  const addAppointment = (apt: Omit<Appointment, "appointmentId">) => {
    const newApt: Appointment = {
      ...apt,
      appointmentId: `apt-${Date.now().toString().slice(-4)}`,
    };
    setAppointments((prev) => [newApt, ...prev]);

    // Update patient total visits if contact exists
    setContacts((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === apt.customerName.toLowerCase()
          ? {
              ...c,
              totalVisits: c.totalVisits + 1,
              lastVisit: apt.appointmentDate,
            }
          : c
      )
    );
  };

  const updateAppointment = (id: string, updated: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.appointmentId === id ? { ...a, ...updated } : a))
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.appointmentId !== id));
  };

  // Pharmacy
  const addPharmacyItem = (item: Omit<PharmacyItem, "itemId">) => {
    const newItem: PharmacyItem = {
      ...item,
      itemId: `phm-${String(pharmacy.length + 1).padStart(3, "0")}`,
    };
    setPharmacy((prev) => [newItem, ...prev]);
  };

  const updatePharmacyItem = (id: string, updated: Partial<PharmacyItem>) => {
    setPharmacy((prev) =>
      prev.map((p) => (p.itemId === id ? { ...p, ...updated } : p))
    );
  };

  const deletePharmacyItem = (id: string) => {
    setPharmacy((prev) => prev.filter((p) => p.itemId !== id));
  };

  // Sales (Income)
  const addSale = (sale: Omit<Sale, "saleId">) => {
    const newSale: Sale = {
      ...sale,
      saleId: `sal-${Date.now().toString().slice(-4)}`,
    };
    setSales((prev) => [newSale, ...prev]);

    // Update contact total spent
    setContacts((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === sale.customerName.toLowerCase()
          ? {
              ...c,
              totalSpent: c.totalSpent + sale.netAmount,
              lastVisit: sale.saleDate,
            }
          : c
      )
    );
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.saleId !== id));
  };

  // Expenses
  const addExpense = (exp: Omit<Expense, "expenseId">) => {
    const newExp: Expense = {
      ...exp,
      expenseId: `exp-${Date.now().toString().slice(-4)}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.expenseId !== id));
  };

  // Attendance
  const markAttendance = (
    employeeId: string,
    status: AttendanceStatus,
    targetDate?: string,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => {
    const dateStr = targetDate || new Date().toISOString().split("T")[0];
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;

    setAttendance((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.employeeId === employeeId && a.date === dateStr
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          checkIn: checkIn || updated[existingIndex].checkIn,
          checkOut: checkOut || updated[existingIndex].checkOut,
          remarks: remarks || updated[existingIndex].remarks,
        };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          attendanceId: `att-${Date.now().toString().slice(-6)}`,
          employeeId,
          employeeName: emp.name,
          date: dateStr,
          status,
          checkIn: checkIn || "09:00",
          checkOut: checkOut || (status === "present" ? "18:00" : undefined),
          markedBy: "Current Manager",
          remarks,
        };
        return [newRecord, ...prev];
      }
    });
  };

  // Salaries
  const generateMonthlySalaries = (month: string, recordedBy: string) => {
    const generated: SalaryRecord[] = employees.map((emp) => {
      return calculateSalaryForEmployee({
        employee: emp,
        month,
        attendanceRecords: attendance,
        standardWorkingDays: 26,
        recordedBy,
      });
    });

    setSalaries((prev) => {
      // Remove existing records for this month and add new
      const filtered = prev.filter((s) => s.month !== month);
      return [...generated, ...filtered];
    });
  };

  const updateSalaryStatus = (salaryId: string, status: SalaryStatus) => {
    setSalaries((prev) =>
      prev.map((s) =>
        s.salaryId === salaryId
          ? {
              ...s,
              status,
              paymentDate: status === "paid" ? new Date().toISOString().split("T")[0] : s.paymentDate,
            }
          : s
      )
    );
  };

  // Contacts
  const addContact = (
    contact: Omit<Contact, "contactId" | "totalVisits" | "totalSpent" | "createdAt">
  ) => {
    const newContact: Contact = {
      ...contact,
      contactId: `cnt-${String(contacts.length + 1).padStart(3, "0")}`,
      totalVisits: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setContacts((prev) => [newContact, ...prev]);
  };

  const updateContact = (id: string, updated: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.contactId === id ? { ...c, ...updated } : c))
    );
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.contactId !== id));
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        updateSettings,
        employees,
        addEmployee,
        addMultipleEmployees,
        updateEmployee,
        deleteEmployee,
        treatments,
        addTreatment,
        updateTreatment,
        deleteTreatment,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        pharmacy,
        addPharmacyItem,
        updatePharmacyItem,
        deletePharmacyItem,
        sales,
        addSale,
        deleteSale,
        expenses,
        addExpense,
        deleteExpense,
        attendance,
        markAttendance,
        salaries,
        generateMonthlySalaries,
        updateSalaryStatus,
        contacts,
        addContact,
        updateContact,
        deleteContact,
        resetToDefaultSeed,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
