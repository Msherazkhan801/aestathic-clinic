"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Employee } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Printer, Sparkles, X, Download } from "lucide-react";

interface BulkQrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  clinicName?: string;
}

export function BulkQrPrintModal({
  isOpen,
  onClose,
  employees,
  clinicName = "SHEZI AESTHETICS",
}: BulkQrPrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const cardsHtml = employees
      .map((emp) => {
        const initials = emp.name.replace("Dr. ", "").slice(0, 2).toUpperCase();
        const qrPayload = JSON.stringify({
          type: "ACMS_ATTENDANCE",
          employeeId: emp.employeeId,
          name: emp.name,
          role: emp.role,
        });

        return `
          <div class="badge-card">
            <div class="header-title">${clinicName}</div>
            <div class="header-sub">Staff Digital ID & Attendance</div>
            
            <div class="avatar">${initials}</div>
            <div class="name">${emp.name}</div>
            <div class="designation">${emp.designation}</div>
            <div class="emp-id-pill">ID: ${emp.employeeId.toUpperCase()}</div>
            
            <div class="qr-box" id="qr-${emp.employeeId}"></div>
            
            <div class="footer-info">
              <div>Shift: <span class="shift-time">${emp.shiftStart || "09:00"} - ${emp.shiftEnd || "17:30"}</span></div>
              <div style="margin-top: 3px;">Scan at Front Desk to Check-In & Check-Out</div>
            </div>
          </div>
        `;
      })
      .join("");

    const qrScripts = employees
      .map((emp) => {
        const qrPayload = JSON.stringify({
          type: "ACMS_ATTENDANCE",
          employeeId: emp.employeeId,
          name: emp.name,
          role: emp.role,
        });

        return `
          QRCode.toString(${JSON.stringify(qrPayload)}, { type: 'svg', width: 130, margin: 1 }, function (err, string) {
            if (!err) {
              var el = document.getElementById('qr-${emp.employeeId}');
              if (el) el.innerHTML = string;
            }
          });
        `;
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${clinicName} - All Staff Attendance Badges</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              justify-items: center;
            }
            .badge-card {
              width: 270px;
              background: #0f172a;
              color: #ffffff;
              border-radius: 16px;
              padding: 16px 14px;
              text-align: center;
              box-sizing: border-box;
              border: 2px solid #334155;
              page-break-inside: avoid;
              margin-bottom: 12px;
            }
            .header-title {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #38bdf8;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .header-sub {
              font-size: 9px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
            }
            .avatar {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: linear-gradient(135deg, #0284c7, #0d9488);
              color: #ffffff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              border: 2px solid #1e293b;
            }
            .name {
              font-size: 14px;
              font-weight: 800;
              color: #ffffff;
              margin: 0 0 2px 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .designation {
              font-size: 10px;
              color: #38bdf8;
              font-weight: 600;
              margin-bottom: 6px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .emp-id-pill {
              display: inline-block;
              background: #1e293b;
              border: 1px solid #475569;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-family: monospace;
              color: #f1f5f9;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .qr-box {
              background: #ffffff;
              padding: 8px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .footer-info {
              font-size: 9px;
              color: #94a3b8;
              line-height: 1.3;
            }
            .shift-time {
              color: #e2e8f0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cardsHtml}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            ${qrScripts}
            setTimeout(function() {
              window.print();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinic Staff Attendance Badges & QR Cards"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-clinic-400" />
              <span>Ready for Print / Badge Generation</span>
            </h4>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              {employees.length} distinct QR codes generated for clinic staff members.
            </p>
          </div>

          <button
            onClick={handlePrintAll}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Staff Badges (A4 Sheet)</span>
          </button>
        </div>

        {/* Badges Grid Preview */}
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => {
              const qrPayload = JSON.stringify({
                type: "ACMS_ATTENDANCE",
                employeeId: emp.employeeId,
                name: emp.name,
                role: emp.role,
              });
              const initials = emp.name.replace("Dr. ", "").slice(0, 2).toUpperCase();

              return (
                <div
                  key={emp.employeeId}
                  className="rounded-xl bg-dark-card border border-slate-700/80 p-4 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-full">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-clinic-600 to-teal-500 mx-auto flex items-center justify-center text-white text-xs font-bold mb-2">
                      {initials}
                    </div>
                    <h5 className="text-xs font-bold text-white truncate">{emp.name}</h5>
                    <p className="text-[10px] text-clinic-400 font-medium truncate">
                      {emp.designation}
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded bg-slate-800 text-[9px] font-mono text-slate-300 border border-slate-700">
                      {emp.employeeId.toUpperCase()}
                    </span>
                  </div>

                  <div className="my-3 p-2 bg-white rounded-lg">
                    <QRCodeSVG value={qrPayload} size={100} level="M" />
                  </div>

                  <p className="text-[9px] text-slate-400 font-mono">
                    Shift: {emp.shiftStart || "09:00"} - {emp.shiftEnd || "17:30"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}
