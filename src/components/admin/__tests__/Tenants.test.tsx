import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenantManagement from '../Tenants';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { translations } from '@/lib/i18n';
import type { User } from '@/lib/types';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/lib/firebase/client', () => ({
  auth: {}, // Mock auth object
  db: {},   // Mock db object
}));

// Mock the entire firestore module to prevent network calls
jest.mock('@/lib/firebase/firestore', () => ({
  getUser: jest.fn().mockResolvedValue(null),
  getTenants: jest.fn().mockResolvedValue([]),
  getProperties: jest.fn().mockResolvedValue([]),
  getInvoices: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions', () => ({
    createTenantAction: jest.fn().mockResolvedValue({ success: true, isNewUser: true }),
}));

const mockUser = {
  uid: 'test-admin-id',
  email: 'admin@test.com',
  displayName: 'Test Admin',
};

// The mock for 'firebase/auth' needs to include all functions used by the components under test.
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Immediately call the callback with a mock user to simulate logged-in state.
      callback(mockUser);
      // Return a dummy unsubscribe function
      return jest.fn();
    }),
}));

// A custom wrapper to provide necessary context for the component
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
        <AppProvider>
            {children}
        </AppProvider>
    </AuthProvider>
  );
};


describe('TenantForm Validations', () => {
    
  beforeEach(() => {
    // Mocking IntersectionObserver for Radix UI components
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('shows required validation messages when submitting an empty form', async () => {
    render(<TenantManagement />, { wrapper: AllTheProviders });
    
    // Open the dialog
    const addButton = screen.getByText('Add Tenant');
    fireEvent.click(addButton);

    // Find and click the save button
    const saveButton = await screen.findByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Check for validation messages
    await waitFor(() => {
        expect(screen.getByText(translations.en['validation.name.required'])).toBeInTheDocument();
        expect(screen.getByText(translations.en['validation.email.invalid'])).toBeInTheDocument();
        expect(screen.getByText(translations.en['validation.phone.invalid'])).toBeInTheDocument();
        expect(screen.getByText(translations.en['validation.propertyId.required'])).toBeInTheDocument();
        expect(screen.getByText(translations.en['validation.startDate.required'])).toBeInTheDocument();
    });
  });

  it('clears validation message when a required field is filled correctly', async () => {
    render(<TenantManagement />, { wrapper: AllTheProviders });
    
    const addButton = screen.getByText('Add Tenant');
    fireEvent.click(addButton);

    const saveButton = await screen.findByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Initially, the error is present
    await waitFor(() => {
        expect(screen.getByText(translations.en['validation.name.required'])).toBeInTheDocument();
    });

    // Fill in the name field
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    // The error message should disappear
    await waitFor(() => {
        expect(screen.queryByText(translations.en['validation.name.required'])).not.toBeInTheDocument();
    });
  });

    it('shows invalid email error and then clears it', async () => {
        render(<TenantManagement />, { wrapper: AllTheProviders });
        
        const addButton = screen.getByText('Add Tenant');
        fireEvent.click(addButton);

        const emailInput = screen.getByLabelText(/email/i);
        const saveButton = await screen.findByRole('button', { name: /save/i });

        // Type an invalid email
        fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
        fireEvent.click(saveButton);
        
        // Error should be visible
        await waitFor(() => {
            expect(screen.getByText(translations.en['validation.email.invalid'])).toBeInTheDocument();
        });

        // Type a valid email
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        
        // Error should disappear
        await waitFor(() => {
            expect(screen.queryByText(translations.en['validation.email.invalid'])).not.toBeInTheDocument();
        });
    });
});
