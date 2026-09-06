import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { Employee, Appointment, Sale, Expense, PharmacyItem, Treatment, AttendanceRecord, SalaryRecord, Contact, ClinicSettings } from "@/types";
import {
  defaultSettings,
  seedEmployees,
  seedTreatments,
  seedContacts,
  seedAppointments,
  seedPharmacy,
  seedSales,
  seedExpenses,
  seedAttendance,
  seedSalaries,
} from "@/lib/seedData";

export const COLLECTIONS = {
  USERS: "users",
  EMPLOYEES: "employees",
  ATTENDANCE: "attendance",
  APPOINTMENTS: "appointments",
  TREATMENTS: "treatments",
  PHARMACY: "pharmacy",
  SALES: "sales",
  EXPENSES: "expenses",
  SALARIES: "salaries",
  CONTACTS: "contacts",
  SETTINGS: "settings",
} as const;

export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return [];
  try {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ ...d.data() })) as T[];
  } catch (error) {
    console.warn(`Firestore read failed for ${collectionName} (using local fallback):`, error);
    return [];
  }
}

export async function addDocument<T extends object>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<string> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return customId || `local-${Date.now()}`;
  try {
    if (customId) {
      const docRef = doc(firestore, collectionName, customId);
      await setDoc(docRef, data, { merge: true });
      return customId;
    } else {
      const colRef = collection(firestore, collectionName);
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    }
  } catch (error) {
    console.warn(`Firestore write failed for ${collectionName}:`, error);
    return customId || `local-${Date.now()}`;
  }
}

export async function clearCollection(collectionName: string): Promise<number> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return 0;
  try {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return 0;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return snapshot.docs.length;
  } catch (error) {
    console.warn(`Error clearing collection ${collectionName}:`, error);
    return 0;
  }
}

export async function saveEmployeeToFirestore(emp: Employee): Promise<void> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return;
  try {
    // Save to employees collection
    const empRef = doc(firestore, COLLECTIONS.EMPLOYEES, emp.employeeId);
    await setDoc(empRef, emp, { merge: true });

    // Also save user auth record to users collection
    const userDocId = emp.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    const userRef = doc(firestore, COLLECTIONS.USERS, userDocId);
    await setDoc(
      userRef,
      {
        uid: emp.employeeId,
        email: emp.email,
        displayName: emp.name,
        role: emp.role,
        password: emp.password,
        designation: emp.designation,
        phone: emp.phone,
        isActive: emp.isActive,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`Saved employee ${emp.name} (${emp.email}) to Firestore.`);
  } catch (error) {
    console.warn("Error saving employee to Firestore:", error);
  }
}

export async function saveMultipleEmployeesToFirestore(emps: Employee[]): Promise<void> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore || emps.length === 0) return;
  try {
    const batch = writeBatch(firestore);
    emps.forEach((emp) => {
      const empRef = doc(firestore, COLLECTIONS.EMPLOYEES, emp.employeeId);
      batch.set(empRef, emp, { merge: true });

      const userDocId = emp.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      const userRef = doc(firestore, COLLECTIONS.USERS, userDocId);
      batch.set(
        userRef,
        {
          uid: emp.employeeId,
          email: emp.email,
          displayName: emp.name,
          role: emp.role,
          password: emp.password,
          designation: emp.designation,
          phone: emp.phone,
          isActive: emp.isActive,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
    console.log(`Batch saved ${emps.length} employees to Firestore.`);
  } catch (error) {
    console.warn("Error batch saving employees to Firestore:", error);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string, email?: string): Promise<void> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return;
  try {
    const empRef = doc(firestore, COLLECTIONS.EMPLOYEES, employeeId);
    await deleteDoc(empRef);

    if (email) {
      const userDocId = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      const userRef = doc(firestore, COLLECTIONS.USERS, userDocId);
      await deleteDoc(userRef);
    }
  } catch (error) {
    console.warn("Error deleting employee from Firestore:", error);
  }
}

export async function updateDocument<T extends object>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<boolean> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return true;
  try {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, data as Record<string, unknown>);
    return true;
  } catch (error) {
    console.warn(`Error updating document ${docId} in ${collectionName}:`, error);
    return false;
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) return true;
  try {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn(`Error deleting document ${docId} from ${collectionName}:`, error);
    return false;
  }
}

/**
 * Seeds exactly 3 clean items per section directly to Firestore Cloud Database
 * and removes all obsolete dummy records.
 */
export async function seedCleanDatabaseToFirestore() {
  const firestore = db;
  if (!isFirebaseConfigured || !firestore) {
    return {
      success: false,
      error: "Firebase Firestore is not initialized or configured.",
    };
  }

  try {
    console.log("Starting full clean database seed to Firestore (3 items per section)...");

    // 1. Clear obsolete collections
    const collectionsToClear = [
      COLLECTIONS.USERS,
      COLLECTIONS.EMPLOYEES,
      COLLECTIONS.PHARMACY,
      COLLECTIONS.TREATMENTS,
      COLLECTIONS.APPOINTMENTS,
      COLLECTIONS.SALES,
      COLLECTIONS.EXPENSES,
      COLLECTIONS.ATTENDANCE,
      COLLECTIONS.SALARIES,
      COLLECTIONS.CONTACTS,
    ];

    for (const col of collectionsToClear) {
      await clearCollection(col);
    }

    // 2. Insert 3 Employees & Auth Users
    await saveMultipleEmployeesToFirestore(seedEmployees);

    // 3. Insert 3 Pharmacy Products
    for (const item of seedPharmacy) {
      await addDocument(COLLECTIONS.PHARMACY, item, item.itemId);
    }

    // 4. Insert 3 Treatments
    for (const trt of seedTreatments) {
      await addDocument(COLLECTIONS.TREATMENTS, trt, trt.treatmentId);
    }

    // 5. Insert 3 Contacts
    for (const c of seedContacts) {
      await addDocument(COLLECTIONS.CONTACTS, c, c.contactId);
    }

    // 6. Insert 3 Appointments
    for (const apt of seedAppointments) {
      await addDocument(COLLECTIONS.APPOINTMENTS, apt, apt.appointmentId);
    }

    // 7. Insert 3 Sales
    for (const sale of seedSales) {
      await addDocument(COLLECTIONS.SALES, sale, sale.saleId);
    }

    // 8. Insert 3 Expenses
    for (const exp of seedExpenses) {
      await addDocument(COLLECTIONS.EXPENSES, exp, exp.expenseId);
    }

    // 9. Insert 3 Attendance Records
    for (const att of seedAttendance) {
      await addDocument(COLLECTIONS.ATTENDANCE, att, att.attendanceId);
    }

    // 10. Insert 3 Salary Records
    for (const sal of seedSalaries) {
      await addDocument(COLLECTIONS.SALARIES, sal, sal.salaryId);
    }

    // 11. Insert Settings
    await addDocument(COLLECTIONS.SETTINGS, defaultSettings, "clinic_config");

    console.log("Firestore Cloud Database seeded successfully with 3 records per section!");

    return {
      success: true,
      seeded: {
        employees: seedEmployees.length,
        products: seedPharmacy.length,
        treatments: seedTreatments.length,
        contacts: seedContacts.length,
        appointments: seedAppointments.length,
        sales: seedSales.length,
        expenses: seedExpenses.length,
        attendance: seedAttendance.length,
        salaries: seedSalaries.length,
        settings: 1,
      },
    };
  } catch (error: any) {
    console.error("Error in seedCleanDatabaseToFirestore:", error);
    return {
      success: false,
      error: error?.message || "Failed to seed Firestore.",
    };
  }
}
