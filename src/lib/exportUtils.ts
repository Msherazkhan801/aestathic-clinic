import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./utils";
import { Expense, Sale, SalaryRecord } from "@/types";

interface ClinicReportExportData {
  clinicName: string;
  startDate: string;
  endDate: string;
  procedureFilter?: string;
  sales: Sale[];
  expenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export function exportReportToPDF(data: ClinicReportExportData) {
  const doc = new jsPDF();

  // Primary Header / Branding
  doc.setFillColor(26, 34, 52); // Deep Charcoal #1A2234
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(230, 200, 160); // Rose Gold / Champagne tone
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.clinicName.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 225);
  doc.text("EXECUTIVE FINANCIAL & OPERATIONS PERFORMANCE REPORT", 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 26);

  // Filter Subheader
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Date Period: ${formatDate(data.startDate)} — ${formatDate(data.endDate)}`,
    14,
    46
  );
  if (data.procedureFilter && data.procedureFilter !== "ALL") {
    doc.text(`Filtered Procedure: ${data.procedureFilter}`, 14, 52);
  }

  // Summary Metrics Table
  autoTable(doc, {
    startY: data.procedureFilter && data.procedureFilter !== "ALL" ? 58 : 52,
    head: [["Total Revenue / Income", "Total Clinic Expenses", "Net Operating Profit"]],
    body: [
      [
        formatCurrency(data.totalIncome),
        formatCurrency(data.totalExpense),
        formatCurrency(data.netProfit),
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [170, 130, 115], // Clinic Rose Gold
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      textColor: [30, 30, 30],
    },
  });

  // Sales / Income Transactions Table
  const lastY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 34, 52);
  doc.text("Income / Procedure Sales Breakdown", 14, lastY);

  const salesRows = data.sales.map((sale) => [
    sale.saleDate,
    sale.invoiceNumber,
    sale.customerName,
    sale.procedureName,
    sale.paymentMethod.replace("_", " ").toUpperCase(),
    formatCurrency(sale.netAmount),
  ]);

  autoTable(doc, {
    startY: lastY + 4,
    head: [["Date", "Invoice #", "Customer", "Procedure", "Method", "Amount"]],
    body: salesRows.length > 0 ? salesRows : [["—", "—", "No sales records for selected period", "—", "—", "Rs. 0.00"]],
    theme: "striped",
    headStyles: {
      fillColor: [38, 53, 77],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
    },
    columnStyles: {
      5: { halign: "right", fontStyle: "bold" },
    },
  });

  // Expenses Breakdown Table
  const expenseY = (doc as any).lastAutoTable.finalY + 12;
  if (expenseY > 240) {
    doc.addPage();
  }
  const currentExpenseY = expenseY > 240 ? 20 : expenseY;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 34, 52);
  doc.text("Clinic Expenses Breakdown", 14, currentExpenseY);

  const expenseRows = data.expenses.map((exp) => [
    exp.expenseDate,
    exp.category,
    exp.description,
    exp.vendor || "—",
    formatCurrency(exp.amount),
  ]);

  autoTable(doc, {
    startY: currentExpenseY + 4,
    head: [["Date", "Category", "Description", "Vendor", "Amount"]],
    body: expenseRows.length > 0 ? expenseRows : [["—", "—", "No expense records", "—", "Rs. 0.00"]],
    theme: "striped",
    headStyles: {
      fillColor: [122, 84, 71],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
    },
    columnStyles: {
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Confidential Financial Document — Page ${i} of ${totalPages}`,
      14,
      288
    );
  }

  doc.save(`Shezi_Clinic_Report_${data.startDate}_to_${data.endDate}.pdf`);
}

export function exportPayslipToPDF(salary: SalaryRecord, clinicName: string) {
  const doc = new jsPDF();

  // Luxury Header Banner
  doc.setFillColor(26, 34, 52);
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(230, 200, 160);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(clinicName.toUpperCase(), 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("EMPLOYEE OFFICIAL SALARY PAYSLIP", 14, 28);
  doc.text(`Payslip Ref: ${salary.payslipNumber}`, 140, 28);
  doc.text(`Pay Month: ${salary.month}`, 140, 35);

  // Employee Profile Card
  autoTable(doc, {
    startY: 50,
    head: [["Employee Details", "Compensation Breakdown"]],
    body: [
      [
        `Name: ${salary.employeeName}\nDesignation: ${salary.designation}\nStaff ID: ${salary.employeeId}\nStatus: ${salary.status.toUpperCase()}`,
        `Base Salary: ${formatCurrency(salary.baseSalary)}\nWorking Days: ${salary.workingDays}\nDays Present: ${salary.presentDays}\nDays Absent: ${salary.absentDays}\nDaily Wage: ${formatCurrency(salary.dailyRate)}`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [170, 130, 115],
      textColor: [255, 255, 255],
    },
    bodyStyles: {
      fontSize: 9.5,
      cellPadding: 6,
    },
  });

  // Financial Earnings & Deductions Table
  const calcY = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: calcY,
    head: [["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"]],
    body: [
      [
        "Base Monthly Salary",
        formatCurrency(salary.baseSalary),
        `Absence Penalty (${salary.absentDays} days)`,
        formatCurrency(salary.deductions),
      ],
      [
        "Performance Incentive / Bonus",
        formatCurrency(salary.bonus),
        "Other Deductions",
        formatCurrency(0),
      ],
      [
        { content: "Gross Earnings", styles: { fontStyle: "bold" } },
        { content: formatCurrency(salary.baseSalary + salary.bonus), styles: { fontStyle: "bold" } },
        { content: "Total Deductions", styles: { fontStyle: "bold", textColor: [200, 30, 30] } },
        { content: formatCurrency(salary.deductions), styles: { fontStyle: "bold", textColor: [200, 30, 30] } },
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [38, 53, 77],
    },
  });

  // Net Pay Callout Box
  const netY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFillColor(245, 240, 235);
  doc.rect(14, netY, 182, 24, "F");
  doc.setDrawColor(170, 130, 115);
  doc.rect(14, netY, 182, 24, "S");

  doc.setFontSize(11);
  doc.setTextColor(100, 70, 60);
  doc.setFont("helvetica", "bold");
  doc.text("NET SALARY PAYABLE:", 20, netY + 15);

  doc.setFontSize(16);
  doc.setTextColor(16, 140, 90); // Emerald Green
  doc.text(formatCurrency(salary.netPay), 140, netY + 16);

  // Signatures
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("__________________________", 24, netY + 55);
  doc.text("Employee Signature", 24, netY + 62);

  doc.text("__________________________", 130, netY + 55);
  doc.text("Authorized Clinic Manager", 130, netY + 62);

  doc.save(`Payslip_${salary.employeeName.replace(/\s+/g, "_")}_${salary.month}.pdf`);
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
