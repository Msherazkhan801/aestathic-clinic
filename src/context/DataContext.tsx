"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
import {
  COLLECTIONS,
  getCollectionData,
  addDocument,
  updateDocument,
  deleteDocument,
  saveEmployeeToFirestore,
  saveMultipleEmployeesToFirestore,
  deleteEmployeeFromFirestore,
} from "@/lib/firebase/firestore";
import { isFirebaseConfigured, db } from "@/lib/firebase/config";

interface DataContextType {
  // Settings
  settings: ClinicSettings;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;

  // Cloud Status
  isFirebaseCloudActive: boolean;
  syncAllToCloud: () => Promise<void>;

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

  // 1. Initial Load from LocalStorage
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
        setSettings(parsed);
      }

      const storedEmployees = localStorage.getItem("clinic_employees");
      if (storedEmployees) {
        const parsed = JSON.parse(storedEmployees);
        setEmployees(parsed);
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

  // 2. Fetch or Sync with Firebase Firestore on client startup
  useEffect(() => {
    async function loadCloudData() {
      if (!isFirebaseConfigured || !db) return;
      try {
        console.log("Connecting to Firebase Cloud Firestore for SHEZI AESTHETICS...");
        const cloudEmployees = await getCollectionData<Employee>(COLLECTIONS.EMPLOYEES);
        if (cloudEmployees && cloudEmployees.length > 0) {
          setEmployees(cloudEmployees);
          localStorage.setItem("clinic_employees", JSON.stringify(cloudEmployees));
        } else {
          // Initialize Firestore cloud with existing employees
          saveMultipleEmployeesToFirestore(employees.length > 0 ? employees : seedEmployees);
        }

        const cloudAppointments = await getCollectionData<Appointment>(COLLECTIONS.APPOINTMENTS);
        if (cloudAppointments && cloudAppointments.length > 0) {
          setAppointments(cloudAppointments);
        }

        const cloudSales = await getCollectionData<Sale>(COLLECTIONS.SALES);
        if (cloudSales && cloudSales.length > 0) {
          setSales(cloudSales);
        }

        const cloudExpenses = await getCollectionData<Expense>(COLLECTIONS.EXPENSES);
        if (cloudExpenses && cloudExpenses.length > 0) {
          setExpenses(cloudExpenses);
        }

        const cloudPharmacy = await getCollectionData<PharmacyItem>(COLLECTIONS.PHARMACY);
        if (cloudPharmacy && cloudPharmacy.length > 0) {
          setPharmacy(cloudPharmacy);
        }

        const cloudTreatments = await getCollectionData<Treatment>(COLLECTIONS.TREATMENTS);
        if (cloudTreatments && cloudTreatments.length > 0) {
          setTreatments(cloudTreatments);
        }
      } catch (err) {
        console.warn("Firestore background sync notice:", err);
      }
    }
    loadCloudData();
  }, []);

  // 3. Sync to LocalStorage whenever state changes
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

  // Sync All Data to Firestore Cloud
  const syncAllToCloud = useCallback(async () => {
    if (!isFirebaseConfigured || !db) return;
    try {
      await saveMultipleEmployeesToFirestore(employees);
      for (const sale of sales) {
        await addDocument(COLLECTIONS.SALES, sale, sale.saleId);
      }
      for (const exp of expenses) {
        await addDocument(COLLECTIONS.EXPENSES, exp, exp.expenseId);
      }
      for (const apt of appointments) {
        await addDocument(COLLECTIONS.APPOINTMENTS, apt, apt.appointmentId);
      }
      for (const item of pharmacy) {
        await addDocument(COLLECTIONS.PHARMACY, item, item.itemId);
      }
      for (const trt of treatments) {
        await addDocument(COLLECTIONS.TREATMENTS, trt, trt.treatmentId);
      }
      for (const c of contacts) {
        await addDocument(COLLECTIONS.CONTACTS, c, c.contactId);
      }
      await addDocument(COLLECTIONS.SETTINGS, settings, "clinic_config");
      console.log("All data successfully pushed to Firebase Cloud Firestore!");
    } catch (e) {
      console.error("Error pushing data to Firebase Cloud:", e);
    }
  }, [employees, sales, expenses, appointments, pharmacy, treatments, contacts, settings]);

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
    saveMultipleEmployeesToFirestore(seedEmployees);
  };

  // Settings
  const updateSettings = (newSettings: Partial<ClinicSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      addDocument(COLLECTIONS.SETTINGS, updated, "clinic_config");
      return updated;
    });
  };

  // Employees & Users Management
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

    // Save directly to Firebase Firestore
    saveEmployeeToFirestore(newEmp);
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

    // Save directly to Firebase Firestore
    saveMultipleEmployeesToFirestore(created);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) => {
      const next = prev.map((e) => (e.employeeId === id ? { ...e, ...updated } : e));
      const target = next.find((e) => e.employeeId === id);
      if (target) {
        saveEmployeeToFirestore(target);
      }
      return next;
    });
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.employeeId === id);
    setEmployees((prev) => prev.filter((e) => e.employeeId !== id));
    deleteEmployeeFromFirestore(id, target?.email);
  };

  // Treatments
  const addTreatment = (trt: Omit<Treatment, "treatmentId">) => {
    const newTrt: Treatment = {
      ...trt,
      treatmentId: `trt-${Date.now()}`,
    };
    setTreatments((prev) => [newTrt, ...prev]);
    addDocument(COLLECTIONS.TREATMENTS, newTrt, newTrt.treatmentId);
  };

  const updateTreatment = (id: string, updated: Partial<Treatment>) => {
    setTreatments((prev) =>
      prev.map((t) => (t.treatmentId === id ? { ...t, ...updated } : t))
    );
    updateDocument(COLLECTIONS.TREATMENTS, id, updated);
  };

  const deleteTreatment = (id: string) => {
    setTreatments((prev) => prev.filter((t) => t.treatmentId !== id));
    deleteDocument(COLLECTIONS.TREATMENTS, id);
  };

  // Appointments
  const addAppointment = (apt: Omit<Appointment, "appointmentId">) => {
    const newApt: Appointment = {
      ...apt,
      appointmentId: `apt-${Date.now()}`,
    };
    setAppointments((prev) => [newApt, ...prev]);
    addDocument(COLLECTIONS.APPOINTMENTS, newApt, newApt.appointmentId);
  };

  const updateAppointment = (id: string, updated: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.appointmentId === id ? { ...a, ...updated } : a))
    );
    updateDocument(COLLECTIONS.APPOINTMENTS, id, updated);
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.appointmentId !== id));
    deleteDocument(COLLECTIONS.APPOINTMENTS, id);
  };

  // Pharmacy
  const addPharmacyItem = (item: Omit<PharmacyItem, "itemId">) => {
    const newItem: PharmacyItem = {
      ...item,
      itemId: `item-${Date.now()}`,
    };
    setPharmacy((prev) => [newItem, ...prev]);
    addDocument(COLLECTIONS.PHARMACY, newItem, newItem.itemId);
  };

  const updatePharmacyItem = (id: string, updated: Partial<PharmacyItem>) => {
    setPharmacy((prev) =>
      prev.map((p) => (p.itemId === id ? { ...p, ...updated } : p))
    );
    updateDocument(COLLECTIONS.PHARMACY, id, updated);
  };

  const deletePharmacyItem = (id: string) => {
    setPharmacy((prev) => prev.filter((p) => p.itemId !== id));
    deleteDocument(COLLECTIONS.PHARMACY, id);
  };

  // Sales (Income)
  const addSale = (saleData: Omit<Sale, "saleId">) => {
    const newSale: Sale = {
      ...saleData,
      saleId: `sale-${Date.now()}`,
    };
    setSales((prev) => [newSale, ...prev]);
    addDocument(COLLECTIONS.SALES, newSale, newSale.saleId);
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.saleId !== id));
    deleteDocument(COLLECTIONS.SALES, id);
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, "expenseId">) => {
    const newExp: Expense = {
      ...expData,
      expenseId: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    addDocument(COLLECTIONS.EXPENSES, newExp, newExp.expenseId);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.expenseId !== id));
    deleteDocument(COLLECTIONS.EXPENSES, id);
  };

  // Attendance
  const markAttendance = (
    employeeId: string,
    status: AttendanceStatus,
    date?: string,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const emp = employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;

    setAttendance((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.employeeId === employeeId && a.date === targetDate
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        const record = {
          ...updated[existingIndex],
          status,
          checkIn: checkIn || updated[existingIndex].checkIn,
          checkOut: checkOut || updated[existingIndex].checkOut,
          remarks: remarks || updated[existingIndex].remarks,
        };
        updated[existingIndex] = record;
        addDocument(COLLECTIONS.ATTENDANCE, record, record.attendanceId);
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          attendanceId: `att-${Date.now()}`,
          employeeId,
          employeeName: emp.name,
          date: targetDate,
          status,
          checkIn: checkIn || (status === "present" ? "09:00" : undefined),
          checkOut: checkOut || (status === "present" ? "17:30" : undefined),
          markedBy: "System Portal",
          remarks,
        };
        addDocument(COLLECTIONS.ATTENDANCE, newRecord, newRecord.attendanceId);
        return [newRecord, ...prev];
      }
    });
  };

  // Salaries
  const generateMonthlySalaries = (month: string, recordedBy: string) => {
    const newSalaries: SalaryRecord[] = employees.map((emp) => {
      const calculated = calculateSalaryForEmployee(
        emp,
        attendance,
        sales,
        month,
        settings.taxRatePercent
      );
      return {
        salaryId: `sal-${emp.employeeId}-${month}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        role: emp.role,
        month,
        baseSalary: emp.salary,
        totalWorkingDays: calculated.totalWorkingDays,
        daysPresent: calculated.daysPresent,
        daysAbsent: calculated.daysAbsent,
        commissionAmount: calculated.commissionAmount,
        deductions: calculated.taxDeduction,
        netSalaryPaid: calculated.netSalary,
        status: "calculated" as SalaryStatus,
        generatedAt: new Date().toISOString(),
        recordedBy,
      };
    });

    setSalaries((prev) => {
      const filtered = prev.filter((s) => s.month !== month);
      const combined = [...newSalaries, ...filtered];
      return combined;
    });

    for (const sal of newSalaries) {
      addDocument(COLLECTIONS.SALARIES, sal, sal.salaryId);
    }
  };

  const updateSalaryStatus = (salaryId: string, status: SalaryStatus) => {
    setSalaries((prev) =>
      prev.map((s) => (s.salaryId === salaryId ? { ...s, status } : s))
    );
    updateDocument(COLLECTIONS.SALARIES, salaryId, { status });
  };

  // Contacts
  const addContact = (
    contactData: Omit<Contact, "contactId" | "totalVisits" | "totalSpent" | "createdAt">
  ) => {
    const newContact: Contact = {
      ...contactData,
      contactId: `cnt-${Date.now()}`,
      totalVisits: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => [newContact, ...prev]);
    addDocument(COLLECTIONS.CONTACTS, newContact, newContact.contactId);
  };

  const updateContact = (id: string, updated: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.contactId === id ? { ...c, ...updated } : c))
    );
    updateDocument(COLLECTIONS.CONTACTS, id, updated);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.contactId !== id));
    deleteDocument(COLLECTIONS.CONTACTS, id);
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        updateSettings,
        isFirebaseCloudActive: isFirebaseConfigured,
        syncAllToCloud,
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
