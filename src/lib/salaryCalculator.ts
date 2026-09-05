import { AttendanceRecord, Employee, SalaryRecord } from "@/types";
import { generatePayslipNumber } from "./utils";

export interface SalaryCalculationInput {
  employee: Employee;
  month: string; // "YYYY-MM"
  attendanceRecords: AttendanceRecord[];
  standardWorkingDays?: number; // default 26 (excluding Sundays)
  bonus?: number;
  manualDeductions?: number;
  recordedBy: string;
}

export function calculateSalaryForEmployee({
  employee,
  month,
  attendanceRecords,
  standardWorkingDays = 26,
  bonus = 0,
  manualDeductions = 0,
  recordedBy,
}: SalaryCalculationInput): SalaryRecord {
  // Filter attendance for this employee in this month
  const monthRecords = attendanceRecords.filter(
    (record) =>
      record.employeeId === employee.employeeId &&
      record.date.startsWith(month)
  );

  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;

  monthRecords.forEach((rec) => {
    if (rec.status === "present") presentDays += 1;
    else if (rec.status === "absent") absentDays += 1;
    else if (rec.status === "leave") leaveDays += 1;
    else if (rec.status === "half-day") {
      halfDays += 1;
      presentDays += 0.5;
    }
  });

  // Calculate daily wage rate
  const dailyRate = Math.round((employee.salary / standardWorkingDays) * 100) / 100;

  // Unexcused absences deduction (leaves are considered approved/paid or unexcused depending on clinic policy; by default absent days are deducted)
  const attendanceDeductions = Math.round((absentDays + (halfDays * 0.5)) * dailyRate * 100) / 100;
  const totalDeductions = attendanceDeductions + manualDeductions;

  // Net pay calculation
  const rawNetPay = employee.salary - totalDeductions + bonus;
  const netPay = Math.max(0, Math.round(rawNetPay * 100) / 100);

  return {
    salaryId: `sal-${employee.employeeId}-${month}`,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    designation: employee.designation,
    month,
    baseSalary: employee.salary,
    workingDays: standardWorkingDays,
    presentDays: Math.floor(presentDays),
    absentDays,
    leaveDays,
    dailyRate,
    deductions: totalDeductions,
    bonus,
    netPay,
    status: "pending",
    recordedBy,
    payslipNumber: generatePayslipNumber(month, employee.employeeId),
    remarks: `Calculated: ${presentDays} days worked, ${absentDays} absences deducted at Rs. ${dailyRate}/day.`,
  };
}
