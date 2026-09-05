"use client";

import React, { useRef } from "react";
import { Modal } from "./Modal";
import { Sale, ClinicSettings } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, Download, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: ClinicSettings;
}

export function InvoicePreview({
  isOpen,
  onClose,
  sale,
  settings,
}: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Dark Luxury Top Header
    doc.setFillColor(26, 34, 52);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(230, 200, 160);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(settings.clinicName.toUpperCase(), 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(200, 210, 225);
    doc.setFont("helvetica", "normal");
    doc.text(settings.address, 14, 25);
    doc.text(`Phone: ${settings.phone} | Email: ${settings.email}`, 14, 31);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL INVOICE", 140, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice: ${sale.invoiceNumber}`, 140, 25);
    doc.text(`Date: ${formatDate(sale.saleDate)}`, 140, 31);

    // Bill To
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("BILLED TO / PATIENT:", 14, 52);

    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(sale.customerName, 14, 58);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact: ${sale.customerPhone}`, 14, 64);
    doc.text(`Payment: ${sale.paymentMethod.replace("_", " ").toUpperCase()}`, 14, 70);

    // Items Table
    autoTable(doc, {
      startY: 78,
      head: [["Item / Procedure Description", "Category", "Qty", "Unit Price", "Total"]],
      body: [
        [
          sale.procedureName,
          "Clinical Procedure",
          "1",
          formatCurrency(sale.amount),
          formatCurrency(sale.amount),
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [170, 130, 115],
        textColor: [255, 255, 255],
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals Table
    autoTable(doc, {
      startY: finalY,
      head: [["Summary Breakdown", "Amount"]],
      body: [
        ["Subtotal", formatCurrency(sale.amount)],
        ["VIP / Promo Discount", `-${formatCurrency(sale.discount)}`],
        ["Total Paid in Full", formatCurrency(sale.netAmount)],
      ],
      theme: "plain",
      styles: { halign: "right" },
      columnStyles: {
        0: { fontStyle: "bold", halign: "left" },
        1: { fontStyle: "bold" },
      },
    });

    // Sign off & Disclaimer
    const footY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "Thank you for choosing Shezi Aesthetics. We look forward to seeing you at your next consultation!",
      14,
      footY
    );
    doc.text(
      "Post-procedure guidelines: Avoid direct sun exposure and apply broad-spectrum SPF 50 daily.",
      14,
      footY + 5
    );

    doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Procedure Invoice"
      subtitle={`Receipt ref: ${sale.invoiceNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div
          ref={printRef}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner space-y-6 text-slate-200 print:bg-white print:text-black"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-400" />
                <h4 className="text-xl font-bold tracking-tight text-white font-display">
                  {settings.clinicName}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">{settings.tagline}</p>
              <p className="text-xs text-slate-400">{settings.address}</p>
              <p className="text-xs text-slate-400">
                {settings.phone} • {settings.email}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase">
                Paid in Full
              </span>
              <p className="text-sm font-semibold text-white mt-2">
                {sale.invoiceNumber}
              </p>
              <p className="text-xs text-slate-400">Date: {formatDate(sale.saleDate)}</p>
              <p className="text-xs text-slate-400 capitalize">
                Method: {sale.paymentMethod.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Patient / Billed To:
              </p>
              <p className="text-sm font-bold text-white mt-0.5">{sale.customerName}</p>
              <p className="text-xs text-slate-300">Phone: {sale.customerPhone}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Recorded By:
              </p>
              <p className="text-sm font-medium text-slate-200 mt-0.5">
                {sale.recordedBy}
              </p>
              {sale.notes && (
                <p className="text-xs text-slate-400 italic mt-1">{sale.notes}</p>
              )}
            </div>
          </div>

          {/* Procedure Line Item */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2.5">Procedure Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 font-medium text-white">
                    {sale.procedureName}
                  </td>
                  <td className="py-3 text-center text-slate-300">1</td>
                  <td className="py-3 text-right text-slate-300">
                    {formatCurrency(sale.amount)}
                  </td>
                  <td className="py-3 text-right font-semibold text-white">
                    {formatCurrency(sale.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-200">
                  {formatCurrency(sale.amount)}
                </span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Loyalty Discount:</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-700">
                <span>Total Amount:</span>
                <span className="text-emerald-400">
                  {formatCurrency(sale.netAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white text-sm font-bold shadow-glow transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}
