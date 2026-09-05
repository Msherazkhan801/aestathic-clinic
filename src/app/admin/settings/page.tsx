"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import {
  Settings as SettingsIcon,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Percent,
  Sparkles,
  RotateCcw,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetToDefaultSeed } = useData();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    clinicName: settings.clinicName,
    tagline: settings.tagline,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    currencySymbol: settings.currencySymbol,
    taxRatePercent: settings.taxRatePercent,
    workingHours: {
      open: settings.workingHours.open,
      close: settings.workingHours.close,
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    showToast(
      "Settings Saved",
      "Clinic profile, tax rates, and working hours updated.",
      "success"
    );
  };

  const handleReset = () => {
    if (confirm("Reset all settings and clinic records to initial demo defaults?")) {
      resetToDefaultSeed();
      showToast("Defaults Restored", "All demo records have been reset.", "info");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>System & Clinic Configuration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Clinic Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
          Configure branding, official contact details, tax rate, and business schedule.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Clinic Branding Card */}
        <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-5 h-5 text-clinic-400" />
            <h3 className="text-base font-bold text-white font-display">
              Clinic Identity & Branding
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Clinic Name
              </label>
              <input
                type="text"
                required
                value={form.clinicName}
                onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1.5">
                Clinic Physical Address (Printed on Invoices & Reports)
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Reception Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Concierge Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial & Schedule Configuration Card */}
        <div className="rounded-3xl bg-dark-card/90 border border-slate-700/80 p-6 backdrop-blur-xl shadow-glass-dark space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold text-white font-display">
              Financial Rates & Operating Hours
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Local Sales Tax / VAT (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.taxRatePercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    taxRatePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Clinic Opens At
              </label>
              <input
                type="time"
                value={form.workingHours.open}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, open: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Clinic Closes At
              </label>
              <input
                type="time"
                value={form.workingHours.close}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, close: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-clinic-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Seed Data</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white font-bold text-xs uppercase tracking-wider shadow-glow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
