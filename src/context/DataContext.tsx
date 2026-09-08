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
  addSale: (sale: Omit<Sale, "saleId">) => Sale;
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
  recordQrAttendance: (
    qrPayload: string,
    mode?: "auto" | "check-in" | "check-out",
    customTime?: string
  ) => {
    success: boolean;
    message: string;
    record?: AttendanceRecord;
    employee?: Employee;
    actionType: "check-in" | "check-out" | "already-completed" | "error";
    time: string;
    date: string;
  };

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

        const cloudContacts = await getCollectionData<Contact>(COLLECTIONS.CONTACTS);
        if (cloudContacts && cloudContacts.length > 0) {
          setContacts(cloudContacts);
        }

        const cloudAttendance = await getCollectionData<AttendanceRecord>(COLLECTIONS.ATTENDANCE);
        if (cloudAttendance && cloudAttendance.length > 0) {
          setAttendance(cloudAttendance);
        }

        const cloudSalaries = await getCollectionData<SalaryRecord>(COLLECTIONS.SALARIES);
        if (cloudSalaries && cloudSalaries.length > 0) {
          setSalaries(cloudSalaries);
        }

        const cloudSettings = await getCollectionData<ClinicSettings>(COLLECTIONS.SETTINGS);
        if (cloudSettings && cloudSettings.length > 0) {
          setSettings(cloudSettings[0]);
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
      for (const att of attendance) {
        await addDocument(COLLECTIONS.ATTENDANCE, att, att.attendanceId);
      }
      for (const sal of salaries) {
        await addDocument(COLLECTIONS.SALARIES, sal, sal.salaryId);
      }
      await addDocument(COLLECTIONS.SETTINGS, settings, "clinic_config");
      console.log("All data successfully pushed to Firebase Cloud Firestore!");
    } catch (e) {
      console.error("Error pushing data to Firebase Cloud:", e);
    }
  }, [employees, sales, expenses, appointments, pharmacy, treatments, contacts, attendance, salaries, settings]);

  // Reset to seed & clean DB
  const resetToDefaultSeed = async () => {
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

    localStorage.setItem("clinic_settings", JSON.stringify(defaultSettings));
    localStorage.setItem("clinic_employees", JSON.stringify(seedEmployees));
    localStorage.setItem("clinic_treatments", JSON.stringify(seedTreatments));
    localStorage.setItem("clinic_appointments", JSON.stringify(seedAppointments));
    localStorage.setItem("clinic_pharmacy", JSON.stringify(seedPharmacy));
    localStorage.setItem("clinic_sales", JSON.stringify(seedSales));
    localStorage.setItem("clinic_expenses", JSON.stringify(seedExpenses));
    localStorage.setItem("clinic_attendance", JSON.stringify(seedAttendance));
    localStorage.setItem("clinic_salaries", JSON.stringify(seedSalaries));
    localStorage.setItem("clinic_contacts", JSON.stringify(seedContacts));

    if (isFirebaseConfigured && db) {
      try {
        await fetch("/api/seed-db");
      } catch (err) {
        console.warn("API seed fallback:", err);
      }
    }
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
  const addSale = (saleData: Omit<Sale, "saleId">): Sale => {
    // 1. Calculate Cost Price and Profit if not already supplied
    let calculatedCost = saleData.totalCost ?? 0;
    let items = saleData.items;

    if (items && items.length > 0) {
      calculatedCost = items.reduce(
        (sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1),
        0
      );
    } else if (saleData.procedureId) {
      const trt = treatments.find((t) => t.treatmentId === saleData.procedureId);
      calculatedCost = trt?.costPrice || 0;
    }

    const calculatedProfit =
      saleData.profit !== undefined
        ? saleData.profit
        : Math.max(0, saleData.netAmount - calculatedCost);

    const newSale: Sale = {
      ...saleData,
      saleId: `sale-${Date.now()}`,
      totalCost: calculatedCost,
      profit: calculatedProfit,
    };

    // 2. Add to sales list
    setSales((prev) => [newSale, ...prev]);
    addDocument(COLLECTIONS.SALES, newSale, newSale.saleId);

    // 3. Deduct stock from pharmacy for any medicine items sold
    if (items && items.length > 0) {
      const medicineItems = items.filter((it) => it.type === "medicine");
      if (medicineItems.length > 0) {
        setPharmacy((prev) => {
          const updatedPharmacy = prev.map((p) => {
            const soldMatch = medicineItems.find((m) => m.id === p.itemId);
            if (soldMatch) {
              const newQty = Math.max(0, p.quantity - soldMatch.quantity);
              updateDocument(COLLECTIONS.PHARMACY, p.itemId, { quantity: newQty });
              return { ...p, quantity: newQty };
            }
            return p;
          });
          return updatedPharmacy;
        });
      }
    }

    // 4. Update Patient CRM stats if patient exists
    if (saleData.customerName || saleData.customerPhone) {
      setContacts((prev) => {
        const contactIndex = prev.findIndex(
          (c) =>
            (saleData.customerPhone && c.phone === saleData.customerPhone) ||
            c.name.toLowerCase() === saleData.customerName.toLowerCase()
        );
        if (contactIndex >= 0) {
          const updated = [...prev];
          const matched = updated[contactIndex];
          const updatedContact = {
            ...matched,
            totalVisits: (matched.totalVisits || 0) + 1,
            totalSpent: (matched.totalSpent || 0) + saleData.netAmount,
            lastVisit: saleData.saleDate,
          };
          updated[contactIndex] = updatedContact;
          updateDocument(COLLECTIONS.CONTACTS, matched.contactId, {
            totalVisits: updatedContact.totalVisits,
            totalSpent: updatedContact.totalSpent,
            lastVisit: updatedContact.lastVisit,
          });
          return updated;
        }
        return prev;
      });
    }

    return newSale;
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

  const recordQrAttendance = (
    qrPayload: string,
    mode: "auto" | "check-in" | "check-out" = "auto",
    customTime?: string
  ) => {
    const now = new Date();
    const targetDate = now.toISOString().split("T")[0];
    const currentTimeStr =
      customTime ||
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // 1. Resolve Employee from QR Payload
    let targetEmpId = "";
    const cleanPayload = qrPayload.trim();

    try {
      if (cleanPayload.startsWith("{") && cleanPayload.endsWith("}")) {
        const parsed = JSON.parse(cleanPayload);
        targetEmpId = parsed.employeeId || parsed.id || parsed.empId || "";
      }
    } catch {
      // Not JSON, continue with string patterns
    }

    if (!targetEmpId) {
      if (cleanPayload.startsWith("ACMS:EMP:")) {
        targetEmpId = cleanPayload.replace("ACMS:EMP:", "").trim();
      } else if (cleanPayload.startsWith("EMP:")) {
        targetEmpId = cleanPayload.replace("EMP:", "").trim();
      } else {
        targetEmpId = cleanPayload;
      }
    }

    // Match by employeeId, email, or exact name
    const emp = employees.find(
      (e) =>
        e.employeeId.toLowerCase() === targetEmpId.toLowerCase() ||
        e.email.toLowerCase() === targetEmpId.toLowerCase() ||
        e.name.toLowerCase() === targetEmpId.toLowerCase()
    );

    if (!emp) {
      return {
        success: false,
        message: `Employee not found for QR token "${cleanPayload}". Please verify employee badge.`,
        actionType: "error" as const,
        time: currentTimeStr,
        date: targetDate,
      };
    }

    // 2. Determine Action & Update Attendance
    let actionType: "check-in" | "check-out" | "already-completed" = "check-in";
    let message = "";
    let finalRecord: AttendanceRecord;

    const existingRecord = attendance.find(
      (a) => a.employeeId === emp.employeeId && a.date === targetDate
    );

    if (!existingRecord) {
      if (mode === "check-out") {
        actionType = "check-out";
        finalRecord = {
          attendanceId: `att-${Date.now()}`,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          date: targetDate,
          status: "present",
          checkIn: emp.shiftStart || "09:00",
          checkOut: currentTimeStr,
          markedBy: "QR Scanner",
          remarks: "Check-out scanned via QR Badge",
        };
        message = `Checked out at ${currentTimeStr}. Attendance marked as Present.`;
      } else {
        actionType = "check-in";
        finalRecord = {
          attendanceId: `att-${Date.now()}`,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          date: targetDate,
          status: "present",
          checkIn: currentTimeStr,
          checkOut: undefined,
          markedBy: "QR Scanner",
          remarks: "Check-in scanned via QR Badge",
        };
        message = `Check-in recorded at ${currentTimeStr}. Marked Present!`;
      }

      setAttendance((prev) => [finalRecord, ...prev]);
      addDocument(COLLECTIONS.ATTENDANCE, finalRecord, finalRecord.attendanceId);
    } else {
      if (mode === "check-in") {
        actionType = "check-in";
        finalRecord = {
          ...existingRecord,
          status: "present",
          checkIn: currentTimeStr,
          markedBy: "QR Scanner",
          remarks: existingRecord.remarks
            ? `${existingRecord.remarks} | Updated check-in ${currentTimeStr}`
            : "Check-in updated via QR Badge",
        };
        message = `Check-in updated to ${currentTimeStr}.`;
      } else if (mode === "check-out") {
        actionType = "check-out";
        finalRecord = {
          ...existingRecord,
          status: "present",
          checkOut: currentTimeStr,
          markedBy: "QR Scanner",
          remarks: existingRecord.remarks
            ? `${existingRecord.remarks} | Check-out ${currentTimeStr}`
            : "Check-out scanned via QR Badge",
        };
        message = `Check-out recorded at ${currentTimeStr}.`;
      } else {
        // Auto Mode
        if (existingRecord.checkIn && !existingRecord.checkOut) {
          actionType = "check-out";
          finalRecord = {
            ...existingRecord,
            status: "present",
            checkOut: currentTimeStr,
            markedBy: "QR Scanner",
            remarks: existingRecord.remarks
              ? `${existingRecord.remarks} | Check-out ${currentTimeStr}`
              : "Check-out scanned via QR Badge",
          };
          message = `Check-out recorded at ${currentTimeStr}. (Shift complete)`;
        } else if (existingRecord.checkIn && existingRecord.checkOut) {
          actionType = "check-out";
          finalRecord = {
            ...existingRecord,
            status: "present",
            checkOut: currentTimeStr,
            markedBy: "QR Scanner",
            remarks: `${existingRecord.remarks || ""} | Re-scanned check-out at ${currentTimeStr}`.trim(),
          };
          message = `Updated Check-out to ${currentTimeStr}.`;
        } else {
          actionType = "check-in";
          finalRecord = {
            ...existingRecord,
            status: "present",
            checkIn: currentTimeStr,
            markedBy: "QR Scanner",
            remarks: "Check-in scanned via QR Badge",
          };
          message = `Check-in recorded at ${currentTimeStr}. Marked Present!`;
        }
      }

      setAttendance((prev) =>
        prev.map((a) => (a.attendanceId === finalRecord.attendanceId ? finalRecord : a))
      );
      addDocument(COLLECTIONS.ATTENDANCE, finalRecord, finalRecord.attendanceId);
    }

    return {
      success: true,
      message,
      record: finalRecord,
      employee: emp,
      actionType,
      time: currentTimeStr,
      date: targetDate,
    };
  };
  const generateMonthlySalaries = (month: string, recordedBy: string) => {
    const newSalaries: SalaryRecord[] = employees.map((emp) =>
      calculateSalaryForEmployee({
        employee: emp,
        month,
        attendanceRecords: attendance,
        recordedBy,
      })
    );

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
        recordQrAttendance,
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
