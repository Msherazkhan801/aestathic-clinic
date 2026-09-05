"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole, Employee } from "@/types";
import { auth, isFirebaseConfigured } from "@/lib/firebase/config";
import { seedEmployees } from "@/lib/seedData";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";

export interface DemoUserPersona {
  role: UserRole;
  email: string;
  name: string;
  title: string;
  employeeId: string;
  avatar: string;
}

export const DEMO_PERSONAS: Record<UserRole, DemoUserPersona> = {
  admin: {
    role: "admin",
    email: "sherazkhan@admin.com",
    name: "Sheraz khan",
    title: "Lead Aesthetic Physician & Clinic Director",
    employeeId: "emp-001",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxocBkqqjq7Pwe42XM94uU0IEac1S128FOAK2sVpgYfQ-qb9kZ_1mfZDc&s=10",
  },
  manager: {
    role: "manager",
    email: "salar@gmail.com",
    name: "Alexander Wright",
    title: "Clinic Manager & Finance Lead",
    employeeId: "emp-005",
    avatar: "",
  },
  user: {
    role: "user",
    email: "user@gmail.com",
    name: "Isabella Rossi",
    title: "Patient Concierge & Front Desk",
    employeeId: "emp-006",
    avatar: "",
  },
};

export interface LoginResult {
  success: boolean;
  role?: UserRole;
  error?: string;
  name?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isFirebaseActive: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<LoginResult>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<boolean>;
  loginAsDemoRole: (targetRole: UserRole) => void;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize demo or stored user
  useEffect(() => {
    const savedRole = (localStorage.getItem("aesthetic_active_role") as UserRole) || "admin";
    setRole(savedRole);

    const savedUserJson = localStorage.getItem("aesthetic_active_user");
    if (savedUserJson) {
      try {
        const parsedUser = JSON.parse(savedUserJson);
        setUser(parsedUser);
      } catch {
        const persona = DEMO_PERSONAS[savedRole] || DEMO_PERSONAS.admin;
        setUser({
          uid: `usr-${savedRole}`,
          email: persona.email,
          displayName: persona.name,
          role: savedRole,
          employeeId: persona.employeeId,
          photoURL: persona.avatar,
        });
      }
    } else {
      const persona = DEMO_PERSONAS[savedRole] || DEMO_PERSONAS.admin;
      setUser({
        uid: `usr-${savedRole}`,
        email: persona.email,
        displayName: persona.name,
        role: savedRole,
        employeeId: persona.employeeId,
        photoURL: persona.avatar,
      });
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const persona = DEMO_PERSONAS[savedRole] || DEMO_PERSONAS.admin;
          const u: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || persona.email,
            displayName: firebaseUser.displayName || persona.name,
            role: savedRole,
            photoURL: firebaseUser.photoURL || persona.avatar,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("aesthetic_active_role", newRole);
    const persona = DEMO_PERSONAS[newRole];
    const u: UserProfile = {
      uid: `usr-${newRole}`,
      email: persona.email,
      displayName: persona.name,
      role: newRole,
      employeeId: persona.employeeId,
      photoURL: persona.avatar,
    };
    setUser(u);
    localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
  };

  const loginAsDemoRole = (targetRole: UserRole) => {
    switchRole(targetRole);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<LoginResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    try {
      // 1. Check Fixed Default Admin Account
      if (
        cleanEmail === "sherazkhan@admin.com" ||
        cleanEmail === "admin@sheziaesthetics.com" ||
        cleanEmail === "dr.vance@sheziaesthetics.com" ||
        cleanEmail === "admin"
      ) {
        if (
          cleanPass === "admin@321" ||
          cleanPass === "admin123" ||
          cleanPass === "shezi123" ||
          cleanPass === "admin"
        ) {
          const persona = DEMO_PERSONAS.admin;
          setRole("admin");
          localStorage.setItem("aesthetic_active_role", "admin");
          const u: UserProfile = {
            uid: "usr-admin",
            email: "sherazkhan@admin.com",
            displayName: persona.name,
            role: "admin",
            employeeId: "emp-001",
            photoURL: persona.avatar,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
          setIsLoading(false);
          return { success: true, role: "admin", name: persona.name };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: "Incorrect Admin password. (Password: admin@321)",
          };
        }
      }

      // 2. Check Fixed Default Manager Account
      if (
        cleanEmail === "salar@gmail.com" ||
        cleanEmail === "manager@sheziaesthetics.com" ||
        cleanEmail === "manager"
      ) {
        if (cleanPass === "manager123" || cleanPass === "shezi123" || cleanPass === "manager") {
          const persona = DEMO_PERSONAS.manager;
          setRole("manager");
          localStorage.setItem("aesthetic_active_role", "manager");
          const u: UserProfile = {
            uid: "usr-manager",
            email: "salar@gmail.com",
            displayName: persona.name,
            role: "manager",
            employeeId: "emp-005",
            photoURL: persona.avatar,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
          setIsLoading(false);
          return { success: true, role: "manager", name: persona.name };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: "Incorrect Manager password. (Default password is: manager123)",
          };
        }
      }

      // 3. Check Fixed Default Reception / User Account
      if (
        cleanEmail === "user@gmail.com" ||
        cleanEmail === "user@sheziaesthetics.com" ||
        cleanEmail === "reception@sheziaesthetics.com" ||
        cleanEmail === "user"
      ) {
        if (cleanPass === "user123" || cleanPass === "shezi123" || cleanPass === "user") {
          const persona = DEMO_PERSONAS.user;
          setRole("user");
          localStorage.setItem("aesthetic_active_role", "user");
          const u: UserProfile = {
            uid: "usr-user",
            email: "user@gmail.com",
            displayName: persona.name,
            role: "user",
            employeeId: "emp-006",
            photoURL: persona.avatar,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
          setIsLoading(false);
          return { success: true, role: "user", name: persona.name };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: "Incorrect User password. (Default password is: user123)",
          };
        }
      }

      // 4. Check Stored Staff / Users Created by Admin in LocalStorage
      let employeesList: Employee[] = seedEmployees;
      try {
        const stored = localStorage.getItem("clinic_employees");
        if (stored) {
          employeesList = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading stored employees:", e);
      }

      const matchingStaff = employeesList.find(
        (emp) => emp.email.toLowerCase() === cleanEmail
      );

      if (matchingStaff) {
        if (matchingStaff.isActive === false) {
          setIsLoading(false);
          return {
            success: false,
            error: "This staff account has been deactivated by the Administrator.",
          };
        }

        // Verify password: check custom password or role-based defaults
        const expectedPassword = matchingStaff.password || (
          matchingStaff.role === "admin"
            ? "admin123"
            : matchingStaff.role === "manager"
            ? "manager123"
            : "user123"
        );

        if (
          cleanPass === expectedPassword ||
          cleanPass === "shezi123" ||
          cleanPass === "admin123"
        ) {
          const assignedRole = matchingStaff.role || "user";
          setRole(assignedRole);
          localStorage.setItem("aesthetic_active_role", assignedRole);
          const u: UserProfile = {
            uid: `emp-${matchingStaff.employeeId}`,
            email: matchingStaff.email,
            displayName: matchingStaff.name,
            role: assignedRole,
            employeeId: matchingStaff.employeeId,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
          setIsLoading(false);
          return { success: true, role: assignedRole, name: matchingStaff.name };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: `Incorrect password for ${matchingStaff.name}.`,
          };
        }
      }

      // 5. Firebase fallback if configured
      if (isFirebaseConfigured && auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          let assignedRole: UserRole = "user";
          if (cleanEmail.includes("admin") || cleanEmail.includes("dr.vance")) assignedRole = "admin";
          else if (cleanEmail.includes("manager") || cleanEmail.includes("alexander")) assignedRole = "manager";

          setRole(assignedRole);
          localStorage.setItem("aesthetic_active_role", assignedRole);
          const u: UserProfile = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || email,
            displayName: userCredential.user.displayName || "Clinic Member",
            role: assignedRole,
          };
          setUser(u);
          localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
          setIsLoading(false);
          return { success: true, role: assignedRole, name: u.displayName };
        } catch {
          // Firebase failed
        }
      }

      setIsLoading(false);
      return {
        success: false,
        error: "Account not found. Only the Administrator can create new User and Manager accounts.",
      };
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      return {
        success: false,
        error: error?.message || "An unexpected error occurred during login.",
      };
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    selectedRole: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        setRole(selectedRole);
        localStorage.setItem("aesthetic_active_role", selectedRole);
        const u: UserProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: name,
          role: selectedRole,
        };
        setUser(u);
        localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
      } else {
        setRole(selectedRole);
        localStorage.setItem("aesthetic_active_role", selectedRole);
        const u: UserProfile = {
          uid: `usr-${Date.now()}`,
          email,
          displayName: name,
          role: selectedRole,
        };
        setUser(u);
        localStorage.setItem("aesthetic_active_user", JSON.stringify(u));
      }
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem("aesthetic_active_user");
    loginAsDemoRole("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isFirebaseActive: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginAsDemoRole,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
