import type { Property, Tenant, Invoice, Expense, InvoiceStatus } from './types';

export const properties: Property[] = [
  { propertyId: 'prop1', name: 'Main House A', address: '123 Maple St', adminId: 'admin1' },
  { propertyId: 'prop2', name: 'Apartment 102', address: '456 Oak Ave, Unit 102', adminId: 'admin1' },
];

export const tenants: Tenant[] = [
  { tenantId: 'tenant1', name: 'John Doe', contact: 'john.doe@email.com', propertyId: 'prop1', fixedMonthlyRent: 1200, paysUtilities: true },
  { tenantId: 'tenant2', name: 'Jane Smith', contact: 'jane.smith@email.com', propertyId: 'prop2', fixedMonthlyRent: 850, paysUtilities: false },
  { tenantId: 'tenant3', name: 'Mike Johnson', contact: 'mike.j@email.com', propertyId: 'prop1', fixedMonthlyRent: 1150, paysUtilities: true },
];

export const invoices: Invoice[] = [
  {
    invoiceId: 'inv1',
    tenantId: 'tenant1',
    month: '2024-07',
    fixedRentAmount: 1200,
    utilityFees: 75.50,
    totalDue: 1275.50,
    status: 'PAID' as InvoiceStatus,
    paymentProofUrl: 'verified/receipt-jul-2024.jpg',
    submittedPaymentAmount: 1275.50,
    submissionDate: '2024-07-05T10:00:00Z',
  },
  {
    invoiceId: 'inv2',
    tenantId: 'tenant1',
    month: '2024-08',
    fixedRentAmount: 1200,
    utilityFees: 80.00,
    totalDue: 1280.00,
    status: 'PENDING' as InvoiceStatus,
    paymentProofUrl: 'https://picsum.photos/seed/receipt1/400/600',
    submittedPaymentAmount: 1280.00,
    submissionDate: '2024-08-04T14:30:00Z',
  },
  {
    invoiceId: 'inv3',
    tenantId: 'tenant2',
    month: '2024-08',
    fixedRentAmount: 850,
    utilityFees: 0,
    totalDue: 850.00,
    status: 'PENDING' as InvoiceStatus,
    paymentProofUrl: null,
    submittedPaymentAmount: null,
    submissionDate: null,
  },
  {
    invoiceId: 'inv4',
    tenantId: 'tenant2',
    month: '2024-07',
    fixedRentAmount: 850,
    utilityFees: 0,
    totalDue: 850.00,
    status: 'PAID' as InvoiceStatus,
    paymentProofUrl: 'verified/receipt-jul-2024-2.jpg',
    submittedPaymentAmount: 850.00,
    submissionDate: '2024-07-03T11:00:00Z',
  },
    {
    invoiceId: 'inv5',
    tenantId: 'tenant3',
    month: '2024-08',
    fixedRentAmount: 1150,
    utilityFees: 65.00,
    totalDue: 1215.00,
    status: 'PARTIAL' as InvoiceStatus,
    paymentProofUrl: null,
    submittedPaymentAmount: 500,
    submissionDate: '2024-08-06T09:00:00Z',
  },
];

export const expenses: Expense[] = [
  { expenseId: 'exp1', propertyId: 'prop1', type: 'MAINTENANCE_OTHER', amount: 350, description: 'Plumbing repair', date: '2024-07-15T10:00:00Z' },
  { expenseId: 'exp2', propertyId: 'prop1', type: 'FIXED_SERVICE', amount: 250, description: 'Master electricity bill', date: '2024-07-28T10:00:00Z' },
  { expenseId: 'exp3', propertyId: 'prop2', type: 'MAINTENANCE_OTHER', amount: 120, description: 'Lobby cleaning', date: '2024-07-20T10:00:00Z' },
];
