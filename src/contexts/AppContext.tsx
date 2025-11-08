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
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const { user, authKey } = useAuth() || {}; // Use authKey to react to auth changes

  const refreshTenants = useCallback(async () => {
    const tenantsFromDb = await getTenants();
    setTenants(tenantsFromDb);
  }, []);
  
  const refreshProperties = useCallback(async () => {
    const propertiesFromDb = await getProperties();
    setProperties(propertiesFromDb);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      if (user) {
        // Fetch base data
        await Promise.all([refreshTenants(), refreshProperties()]);

        console.log("User ", user)
        
        // Fetch and set role
        const userRole = await getUserRole(user.uid);
        if (userRole === 'tenant') {
          setRole('tenant');
          setCurrentTenantId(user.uid);
        } else {
          // Default to admin for users with 'admin' role or no specific role doc
          setRole('admin');
          setCurrentTenantId(null);
        }
      } else {
        // Reset state on logout
        setRole(null);
        setCurrentTenantId(null);
        setTenants([]);
        setProperties([]);
      }
    };

    initializeApp();
  }, [user, authKey, refreshTenants, refreshProperties]); // Depend on user and authKey
  
  const handleSetRole = (newRole: Role) => {
    // This function is primarily for the dev-mode role switcher.
    setRole(newRole);
    if (newRole === 'tenant') {
        // If the logged-in user is actually a tenant, use their ID
        if (user && role === 'tenant') {
             setCurrentTenantId(user.uid);
        } else if (tenants.length > 0) {
            // For demo purposes, pick the first tenant if the admin is just switching views
            setCurrentTenantId(tenants[0].tenantId);
        } else {
            setCurrentTenantId(null);
        }
    } else {
        // Switching to admin view
        setCurrentTenantId(null);
    }
  };

  return (
    <AppContext.Provider value={{ 
        language, setLanguage, 
        role, setRole: handleSetRole,
        invoices, setInvoices, 
        tenants, setTenants, 
        properties, setProperties,
        currentTenantId, 
        refreshTenants,
        refreshProperties
    }}>
      {children}
    </AppContext.Provider>
  );
}
