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
  if (!isFirebaseConfigured || !db) return [];
  try {
    const colRef = collection(db, collectionName);
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
  if (!isFirebaseConfigured || !db) return customId || `local-${Date.now()}`;
  try {
    if (customId) {
      const docRef = doc(db, collectionName, customId);
      await setDoc(docRef, data, { merge: true });
      return customId;
    } else {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    }
  } catch (error) {
    console.warn(`Firestore write failed for ${collectionName}:`, error);
    return customId || `local-${Date.now()}`;
  }
}

export async function saveEmployeeToFirestore(emp: Employee): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    // Save to employees collection
    const empRef = doc(db, COLLECTIONS.EMPLOYEES, emp.employeeId);
    await setDoc(empRef, emp, { merge: true });

    // Also save user auth record to users collection
    const userDocId = emp.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    const userRef = doc(db, COLLECTIONS.USERS, userDocId);
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
  if (!isFirebaseConfigured || !db || emps.length === 0) return;
  try {
    const batch = writeBatch(db);
    emps.forEach((emp) => {
      const empRef = doc(db, COLLECTIONS.EMPLOYEES, emp.employeeId);
      batch.set(empRef, emp, { merge: true });

      const userDocId = emp.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      const userRef = doc(db, COLLECTIONS.USERS, userDocId);
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
  if (!isFirebaseConfigured || !db) return;
  try {
    const empRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
    await deleteDoc(empRef);

    if (email) {
      const userDocId = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
      const userRef = doc(db, COLLECTIONS.USERS, userDocId);
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
  if (!isFirebaseConfigured || !db) return true;
  try {
    const docRef = doc(db, collectionName, docId);
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
  if (!isFirebaseConfigured || !db) return true;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn(`Error deleting document ${docId} from ${collectionName}:`, error);
    return false;
  }
}
