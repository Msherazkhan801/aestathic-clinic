"use client";

import React, { useRef } from "react";
import { Modal } from "./Modal";
import { Sale, ClinicSettings } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, Download, Sparkles, Pill, Sparkle } from "lucide-react";
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

  // Build normalized line items list
  const lineItems =
    sale.items && sale.items.length > 0
      ? sale.items
      : [
          {
            id: sale.procedureId || "item-1",
            name: sale.procedureName || "Clinical Procedure",
            type: (sale.saleType === "medicine" ? "medicine" : "procedure") as
              | "procedure"
              | "medicine",
            quantity: 1,
            unitPrice: sale.amount,
            costPrice: sale.totalCost || 0,
            totalAmount: sale.amount,
            totalCost: sale.totalCost || 0,
            profit: (sale.profit !== undefined ? sale.profit : sale.amount - (sale.totalCost || 0)),
          },
        ];

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
    doc.text("OFFICIAL RECEIPT / INVOICE", 130, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice: ${sale.invoiceNumber}`, 130, 25);
    doc.text(`Date: ${formatDate(sale.saleDate)}`, 130, 31);

    // Bill To
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("BILLED TO / PATIENT:", 14, 50);

    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(sale.customerName, 14, 56);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact Phone: ${sale.customerPhone}`, 14, 62);
    doc.text(`Cashier / Attendant: ${sale.recordedBy}`, 14, 68);
    doc.text(`Payment Method: ${sale.paymentMethod.replace("_", " ").toUpperCase()}`, 14, 74);

    // Items Table Body
    const tableBody = lineItems.map((item, idx) => [
      `${idx + 1}. ${item.name}${item.batchNumber ? ` (LOT: ${item.batchNumber})` : ""}`,
      item.type === "medicine" ? "Pharmacy Medicine" : "Clinical Procedure",
      `${item.quantity} ${item.unit || (item.type === "medicine" ? "units" : "session")}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalAmount),
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Item / Procedure Description", "Category", "Qty", "Unit Price", "Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [170, 130, 115],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Totals Table
    autoTable(doc, {
      startY: finalY,
      head: [["Financial Summary", "Amount"]],
      body: [
        ["Gross Subtotal", formatCurrency(sale.amount)],
        ["Discounts / Credits", `-${formatCurrency(sale.discount)}`],
        ["Total Amount Paid", formatCurrency(sale.netAmount)],
      ],
      theme: "plain",
      styles: { halign: "right" },
      columnStyles: {
        0: { fontStyle: "bold", halign: "left" },
        1: { fontStyle: "bold" },
      },
    });

    // Sign off & Disclaimer
    const footY = (doc as any).lastAutoTable.finalY + 16;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Thank you for visiting ${settings.clinicName}. Please keep this receipt for warranty and post-procedure records.`,
      14,
      footY
    );
    doc.text(
      "Medicines & cosmeceutical products sold are non-refundable once dispensed from the pharmacy dispensary.",
      14,
      footY + 5
    );

    doc.save(`Receipt_${sale.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Clinic Sales Receipt"
      subtitle={`Invoice Ref: ${sale.invoiceNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div
          ref={printRef}
          className="p-6 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-inner space-y-6 text-slate-200 print:bg-white print:text-black print:p-4 print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-5 gap-4 print:border-gray-300">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-400 print:text-amber-600" />
                <h4 className="text-xl font-bold tracking-tight text-white font-display print:text-black">
                  {settings.clinicName}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1 print:text-gray-600">{settings.tagline}</p>
              <p className="text-xs text-slate-400 print:text-gray-600">{settings.address}</p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                {settings.phone} • {settings.email}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase print:border-emerald-600 print:text-emerald-700">
                Paid in Full
              </span>
              <p className="text-sm font-semibold text-white mt-2 print:text-black font-mono">
                {sale.invoiceNumber}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Date: {formatDate(sale.saleDate)}
              </p>
              <p className="text-xs text-slate-400 capitalize print:text-gray-600">
                Method: {sale.paymentMethod.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Patient & Cashier Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 print:bg-gray-50 print:border-gray-200">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium print:text-gray-500">
                Patient / Billed To:
              </p>
              <p className="text-sm font-bold text-white mt-0.5 print:text-black">
                {sale.customerName}
              </p>
              <p className="text-xs text-slate-300 print:text-gray-700">
                Phone: {sale.customerPhone}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium print:text-gray-500">
                Cashier / Dispensed By:
              </p>
              <p className="text-sm font-medium text-slate-200 mt-0.5 print:text-gray-800">
                {sale.recordedBy}
              </p>
              {sale.notes && (
                <p className="text-xs text-slate-400 italic mt-1 print:text-gray-600">
                  Note: {sale.notes}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700/80 uppercase text-slate-400 print:border-gray-300 print:text-gray-600">
                <tr>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Category</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {lineItems.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`}>
                    <td className="py-3 font-medium text-white print:text-black">
                      <div className="flex items-center gap-1.5">
                        {item.type === "medicine" ? (
                          <Pill className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 print:hidden" />
                        ) : (
                          <Sparkle className="w-3.5 h-3.5 text-clinic-400 flex-shrink-0 print:hidden" />
                        )}
                        <span>{item.name}</span>
                      </div>
                      {item.batchNumber && (
                        <p className="text-[10px] text-slate-400 print:text-gray-500">
                          Batch / Lot: {item.batchNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.type === "medicine"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-none print:text-black"
                            : "bg-clinic-500/10 text-clinic-300 border border-clinic-500/30 print:border-none print:text-black"
                        }`}
                      >
                        {item.type === "medicine" ? "Medicine" : "Procedure"}
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-300 print:text-black font-mono">
                      {item.quantity} {item.unit || (item.type === "medicine" ? "units" : "")}
                    </td>
                    <td className="py-3 text-right text-slate-300 print:text-black font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-semibold text-white print:text-black font-mono">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end pt-4 border-t border-slate-800 print:border-gray-300">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Subtotal Gross:</span>
                <span className="font-medium text-slate-200 print:text-black font-mono">
                  {formatCurrency(sale.amount)}
                </span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-400 print:text-red-600">
                  <span>Loyalty Discount:</span>
                  <span className="font-mono">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-700 print:border-gray-300 print:text-black">
                <span>Net Total Paid:</span>
                <span className="text-emerald-400 print:text-emerald-700 font-mono">
                  {formatCurrency(sale.netAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note for printed receipts */}
          <div className="pt-2 text-center text-[10px] text-slate-500 print:text-gray-500 border-t border-slate-800/60 print:border-gray-200">
            Thank you for choosing {settings.clinicName}. We look forward to seeing you at your next visit!
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-600 transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-500 to-gold-500 hover:from-clinic-600 hover:to-gold-600 text-white text-xs font-bold shadow-glow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
