export interface User {
  id: string; // Same as Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
  roles: ('owner' | 'tenant')[];
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  owners: string[]; // Array of user IDs
  createdAt: string;
  updatedAt: string;
}

// Represents a tenancy or lease agreement
export interface Tenant {
  id: string;
  userId: string;
  propertyId: string;
  fixedMonthlyRent: number;
  paysUtilities: boolean;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'partial';

export interface Invoice {
  id: string;
  tenantId: string; // Link to the tenancy document
  userId: string; // The user who is the tenant
  propertyId: string;
  month: string; // YYYY-MM
  rentAmount: number;
  utilitiesAmount: number;
  totalDue: number;
  status: InvoiceStatus;
  paymentDate: string | null;
  paymentProofUrl?: string | null;
  submittedPaymentAmount?: number | null;
  submissionDate?: string | null;
  createdAt: string;
  updatedAt: string;
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
