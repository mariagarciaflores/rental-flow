'use client';
import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { Invoice, Tenant } from '@/lib/types';
import { invoices as initialInvoices, tenants as initialTenants } from '@/lib/data';

export type Language = 'en' | 'es';
export type Role = 'admin' | 'tenant';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  role: Role;
  setRole: (role: Role) => void;
  invoices: Invoice[];
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  tenants: Tenant[];
  setTenants: Dispatch<SetStateAction<Tenant[]>>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<Role>('admin');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);

  return (
    <AppContext.Provider value={{ language, setLanguage, role, setRole, invoices, setInvoices, tenants, setTenants }}>
      {children}
    </AppContext.Provider>
  );
}
