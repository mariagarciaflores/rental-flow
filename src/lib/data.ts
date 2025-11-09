import type { Property, Tenant, Invoice, Expense, InvoiceStatus, User } from './types';

// This file can now be largely deprecated or used for seeding scripts,
// as all primary data is intended to come from Firestore.
// The data below is kept for reference or potential fallback during development.

export const users: User[] = [
  // { id: 'admin1', name: 'Admin User', email: 'admin@test.com', roles: ['owner'], createdAt: '', updatedAt: ''},
  // { id: 'tenant1', name: 'John Doe', email: 'john.doe@email.com', roles: ['tenant'], createdAt: '', updatedAt: '' },
  // { id: 'tenant2', name: 'Jane Smith', email: 'jane.smith@email.com', roles: ['tenant'], createdAt: '', updatedAt: '' },
  // { id: 'tenant3', name: 'Mike Johnson', email: 'mike.j@email.com', roles: ['tenant'], createdAt: '', updatedAt: '' },
];

export const properties: Property[] = [
  // { id: 'prop1', name: 'Main House A', address: '123 Maple St', owners: ['admin1'], createdAt: '', updatedAt: '' },
  // { id: 'prop2', name: 'Apartment 102', address: '456 Oak Ave, Unit 102', owners: ['admin1'], createdAt: '', updatedAt: '' },
];

export const tenants: Tenant[] = [
  // { id: 'tenancy1', userId: 'tenant1', propertyId: 'prop1', fixedMonthlyRent: 1200, paysUtilities: true, startDate: '2023-01-01', endDate: null, active: true, createdAt: '', updatedAt: '' },
  // { id: 'tenancy2', userId: 'tenant2', propertyId: 'prop2', fixedMonthlyRent: 850, paysUtilities: false, startDate: '2023-01-01', endDate: null, active: true, createdAt: '', updatedAt: '' },
  // { id: 'tenancy3', userId: 'tenant3', propertyId: 'prop1', fixedMonthlyRent: 1150, paysUtilities: true, startDate: '2023-01-01', endDate: null, active: true, createdAt: '', updatedAt: '' },
];

export const invoices: Invoice[] = [
  // {
  //   id: 'inv1',
  //   tenantId: 'tenancy1',
  //   userId: 'tenant1',
  //   propertyId: 'prop1',
  //   month: '2024-07',
  //   rentAmount: 1200,
  //   utilitiesAmount: 75.50,
  //   totalDue: 1275.50,
  //   status: 'paid' as InvoiceStatus,
  //   paymentDate: '2024-07-05T10:00:00Z',
  //   createdAt: '',
  //   updatedAt: '',
  // },
];

export const expenses: Expense[] = [
  { expenseId: 'exp1', propertyId: 'prop1', type: 'MAINTENANCE_OTHER', amount: 350, description: 'Plumbing repair', date: '2024-07-15T10:00:00Z' },
  { expenseId: 'exp2', propertyId: 'prop1', type: 'FIXED_SERVICE', amount: 250, description: 'Master electricity bill', date: '2024-07-28T10:00:00Z' },
  { expenseId: 'exp3', propertyId: 'prop2', type: 'MAINTENANCE_OTHER', amount: 120, description: 'Lobby cleaning', date: '2024-07-20T10:00:00Z' },
];
