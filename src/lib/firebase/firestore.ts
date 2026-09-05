import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";

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
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
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
    console.error(`Error adding document to ${collectionName}:`, error);
    return customId || `local-${Date.now()}`;
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
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
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
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    return false;
  }
}
