"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";
import { Employee } from "@/types";
import { Sparkles, Clock, ShieldCheck, Printer, Download, UserCheck, Briefcase } from "lucide-react";

interface EmployeeQrBadgeProps {
  employee: Employee;
  clinicName?: string;
  onPrint?: () => void;
  compact?: boolean;
}

export function EmployeeQrBadge({
  employee,
  clinicName = "SHEZI AESTHETICS",
  compact = false,
}: EmployeeQrBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);

  // Structured QR Payload
  const qrPayload = JSON.stringify({
    type: "ACMS_ATTENDANCE",
    employeeId: employee.employeeId,
    name: employee.name,
    role: employee.role,
  });

  const handlePrintSingle = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const initials = employee.name.replace("Dr. ", "").slice(0, 2).toUpperCase();
    const qrSvgString = renderToStaticMarkup(
      <QRCodeSVG value={qrPayload} size={140} level="H" includeMargin={false} />
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${employee.name} - Staff ID Badge</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
              background-color: #f8fafc;
              margin: 0;
            }
            .badge-card {
              width: 320px;
              background: #0f172a;
              color: #ffffff;
              border-radius: 20px;
              padding: 24px 20px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.3);
              border: 2px solid #334155;
            }
            .header-title {
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 2px;
              color: #38bdf8;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .header-sub {
              font-size: 10px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
            }
            .avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              background: linear-gradient(135deg, #0284c7, #0d9488);
              color: #ffffff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 12px;
              border: 3px solid #1e293b;
            }
            .name {
              font-size: 18px;
              font-weight: 800;
              color: #ffffff;
              margin: 0 0 4px 0;
            }
            .designation {
              font-size: 12px;
              color: #38bdf8;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .emp-id-pill {
              display: inline-block;
              background: #1e293b;
              border: 1px solid #475569;
              padding: 3px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-family: monospace;
              color: #f1f5f9;
              font-weight: 700;
              margin-bottom: 16px;
            }
            .qr-box {
              background: #ffffff;
              padding: 14px;
              border-radius: 16px;
              display: inline-block;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              margin-bottom: 14px;
            }
            .qr-box svg {
              display: block;
            }
            .footer-info {
              font-size: 10px;
              color: #94a3b8;
              line-height: 1.4;
            }
            .shift-time {
              color: #e2e8f0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header-title">${clinicName}</div>
            <div class="header-sub">Staff Digital ID & Attendance Badge</div>
            
            <div class="avatar">${initials}</div>
            <div class="name">${employee.name}</div>
            <div class="designation">${employee.designation}</div>
            <div class="emp-id-pill">ID: ${employee.employeeId.toUpperCase()}</div>
            
            <div class="qr-box">
              ${qrSvgString}
            </div>
            
            <div class="footer-info">
              <div>Shift: <span class="shift-time">${employee.shiftStart || "09:00"} - ${employee.shiftEnd || "17:30"}</span></div>
              <div style="margin-top: 4px;">Scan at Front Desk to Check-In & Check-Out</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const initials = employee.name.replace("Dr. ", "").slice(0, 2).toUpperCase();

  const roleColor = {
    admin: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
    manager: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
    user: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
  }[employee.role] || "from-clinic-500/20 to-teal-500/20 text-clinic-300 border-clinic-500/30";

  return (
    <div
      ref={badgeRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-dark-card to-slate-950 border border-slate-700/80 shadow-glass-dark text-center transition-all hover:border-clinic-500/50 hover:shadow-glow ${
        compact ? "p-4" : "p-6"
      }`}
    >
      {/* Clinic Header Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-clinic-500 via-teal-400 to-emerald-400" />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-clinic-400">
          <Sparkles className="w-3 h-3" />
          <span>{clinicName}</span>
        </div>
        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">
          Official Staff Attendance Badge
        </p>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center mb-3">
        <div className="relative mb-2.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-clinic-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-base">
              {initials}
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
        </div>

        <h3 className="text-base font-bold text-white tracking-tight leading-tight">
          {employee.name}
        </h3>
        <p className="text-xs text-clinic-300 font-medium mt-0.5">
          {employee.designation}
        </p>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColor}`}
          >
            {employee.role.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {employee.employeeId.toUpperCase()}
          </span>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="my-3 flex flex-col items-center justify-center">
        <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
          <QRCodeSVG
            value={qrPayload}
            size={compact ? 120 : 140}
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-mono mt-1.5">
          Scan to Check In / Out
        </p>
      </div>

      {/* Shift Timing Details */}
      <div className="pt-2 pb-1 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
        <Clock className="w-3.5 h-3.5 text-clinic-400" />
        <span>
          Shift: {employee.shiftStart || "09:00"} - {employee.shiftEnd || "17:30"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={handlePrintSingle}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Badge</span>
        </button>
      </div>
    </div>
  );
}
