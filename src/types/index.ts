export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  photoURL?: string;
  createdAt?: string;
}

export type Designation =
  | 'Lead Aesthetic Physician'
  | 'Cosmetic Dermatologist'
  | 'Senior Aesthetician'
  | 'Laser & Skin Specialist'
  | 'Clinic Manager'
  | 'Front Desk Receptionist'
  | 'Customer Care Executive'
  | 'Registered Aesthetic Nurse';

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  designation: Designation;
  salary: number; // Base monthly salary
  shiftStart: string; // "09:00"
  shiftEnd: string; // "17:00"
  joiningDate: string; // ISO / YYYY-MM-DD
  isActive: boolean;
  profileImage?: string;
  specialization?: string;
  role: UserRole; // 'admin' | 'manager' | 'user'
  password?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half-day';

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // "09:05"
  checkOut?: string; // "17:15"
  markedBy: string;
  remarks?: string;
}

export type TreatmentCategory =
  | 'Facials & Peels'
  | 'Injectables & Fillers'
  | 'Laser & IPL'
  | 'Skin Tightening'
  | 'Hair Restoration'
  | 'Body Contouring & Wellness';

export interface Treatment {
  treatmentId: string;
  name: string;
  description: string;
  price: number; // selling price
  costPrice?: number; // consumable / buy cost
  duration: number; // minutes
  category: TreatmentCategory;
  isActive: boolean;
  image?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  procedureId: string;
  procedureName: string;
  employeeId: string;
  employeeName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM (24h)
  status: AppointmentStatus;
  createdBy: string;
  notes?: string;
  price: number;
}

export type PharmacyCategory =
  | 'Skincare & Cosmeceuticals'
  | 'Injectables & Toxins'
  | 'Post-Procedure Care'
  | 'Supplies & Consumables'
  | 'Nutraceuticals';

export interface PharmacyItem {
  itemId: string;
  name: string;
  category: PharmacyCategory;
  quantity: number;
  unit: string; // e.g. "vials", "boxes", "bottles", "packs"
  minThreshold: number; // alert trigger
  costPrice: number;
  sellingPrice: number;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  batchNumber: string;
}

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'insurance'
  | 'digital_wallet';

export type SaleType = 'procedure' | 'medicine' | 'mixed';

export interface SaleItem {
  id: string; // treatmentId or itemId
  name: string;
  type: 'procedure' | 'medicine';
  quantity: number;
  unitPrice: number; // selling price per unit
  costPrice: number; // actual buy / supply price per unit
  totalAmount: number; // quantity * unitPrice
  totalCost: number; // quantity * costPrice
  profit: number; // totalAmount - totalCost
  unit?: string; // e.g. "vials", "bottles", "session"
  batchNumber?: string;
}

export interface Sale {
  saleId: string;
  invoiceNumber: string;
  appointmentId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Summary title / fallback for backwards compatibility
  procedureId?: string;
  procedureName: string;

  // Itemized support
  saleType?: SaleType; // 'procedure' | 'medicine' | 'mixed'
  items?: SaleItem[]; // full list of procedures & medicines in this invoice

  amount: number; // gross selling amount before discount
  discount: number; // discount granted
  netAmount: number; // actual revenue collected from customer
  totalCost?: number; // total actual buy / cost price of all items
  profit?: number; // netAmount - totalCost (or sum of item profits - discount)

  paymentMethod: PaymentMethod;
  saleDate: string; // YYYY-MM-DD
  recordedBy: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Rent & Premises'
  | 'Medical Supplies & Serums'
  | 'Salaries & Wages'
  | 'Marketing & Social Media'
  | 'Equipment & Maintenance'
  | 'Utilities & Internet'
  | 'Office & Refreshments'
  | 'Other';

export interface Expense {
  expenseId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  recordedBy: string;
  vendor?: string;
  receiptImage?: string;
}

export type SalaryStatus = 'pending' | 'approved' | 'paid';

export interface SalaryRecord {
  salaryId: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  month: string; // "YYYY-MM"
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  dailyRate: number;
  deductions: number;
  bonus: number;
  netPay: number;
  status: SalaryStatus;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  recordedBy: string;
  payslipNumber: string;
  remarks?: string;
}

export interface Contact {
  contactId: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  dob?: string;
  gender?: 'Female' | 'Male' | 'Other' | 'Prefer not to say';
  skinType?: 'Normal' | 'Dry' | 'Oily' | 'Combination' | 'Sensitive';
  medicalHistory?: string;
  allergies?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
  createdAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string;
  taxRatePercent: number;
  workingHours: {
    open: string;
    close: string;
  };
}
