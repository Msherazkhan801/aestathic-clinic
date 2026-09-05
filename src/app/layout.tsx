import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "SHEZI AESTHETICS — Clinical Management System",
  description:
    "Enterprise management portal for aesthetic medicine clinics, doctors, staff attendance, finances, treatments, pharmacy, and patient care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 antialiased selection:bg-clinic-500 selection:text-white">
        <AuthProvider>
          <DataProvider>
            <ToastProvider>{children}</ToastProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
