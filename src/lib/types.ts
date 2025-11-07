export interface Property {
  propertyId: string;
  name: string;
  address: string;
  adminId: string;
}

export interface Tenant {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  propertyId: string;
  fixedMonthlyRent: number;
  paysUtilities: boolean;
  authUid?: string; // Link to Firebase Auth user
}

export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Invoice {
  invoiceId: string;
  tenantId: string;

  month: string; // YYYY-MM
  fixedRentAmount: number;
  utilityFees: number;
  totalDue: number;
  status: InvoiceStatus;
  paymentProofUrl: string | null;
  submittedPaymentAmount: number | null;
  submissionDate: string | null; // ISO 8601 date string
}

export type ExpenseType = 'FIXED_SERVICE' | 'MAINTENANCE_OTHER';

export interface Expense {
  expenseId: string;
  propertyId: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string; // ISO 8601 date string
}
