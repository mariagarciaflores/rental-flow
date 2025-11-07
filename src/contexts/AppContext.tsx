'use client';
import { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import type { Invoice, Tenant, Property } from '@/lib/types';
import { invoices as initialInvoices } from '@/lib/data';
import { useAuth } from './AuthContext';
import { getTenants, getProperties, getUserRole } from '@/lib/firebase/firestore';

export type Language = 'en' | 'es';
export type Role = 'admin' | 'tenant';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  role: Role | null;
  setRole: (role: Role) => void;
  invoices: Invoice[];
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  tenants: Tenant[];
  setTenants: Dispatch<SetStateAction<Tenant[]>>;
  properties: Property[];
  setProperties: Dispatch<SetStateAction<Property[]>>;
  currentTenantId: string | null;
  refreshTenants: () => Promise<void>;
  refreshProperties: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<Role | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const { user } = useAuth() || {}; // Use default empty object if useAuth returns null during SSR
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    const tenantsFromDb = await getTenants();
    setTenants(tenantsFromDb);
  }, []);
  
  const fetchProperties = useCallback(async () => {
    const propertiesFromDb = await getProperties();
    setProperties(propertiesFromDb);
  }, []);

  const fetchUserRole = useCallback(async (uid: string) => {
    const userRole = await getUserRole(uid);
    if (userRole) {
      setRole(userRole);
      if (userRole === 'tenant') {
        setCurrentTenantId(uid);
      } else {
        setCurrentTenantId(null);
      }
    } else {
      // Default to admin if no role is found (e.g. for manually created admins)
      setRole('admin');
      setCurrentTenantId(null);
    }
  }, []);

  useEffect(() => {
    if(user) {
      fetchTenants();
      fetchProperties();
      fetchUserRole(user.uid);
    } else {
      // Reset state on logout
      setRole(null);
      setCurrentTenantId(null);
    }
  }, [user, fetchTenants, fetchProperties, fetchUserRole]);

  return (
    <AppContext.Provider value={{ 
        language, setLanguage, 
        role, setRole: (r) => setRole(r), 
        invoices, setInvoices, 
        tenants, setTenants, 
        properties, setProperties,
        currentTenantId, 
        refreshTenants: fetchTenants,
        refreshProperties: fetchProperties
    }}>
      {children}
    </AppContext.Provider>
  );
}
