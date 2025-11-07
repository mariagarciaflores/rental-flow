'use client';
import { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Invoice, Tenant, Property } from '@/lib/types';
import { invoices as initialInvoices } from '@/lib/data';
import { useAuth } from './AuthContext';
import { getTenants, getProperties } from '@/lib/firebase/firestore';

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
  properties: Property[];
  setProperties: Dispatch<SetStateAction<Property[]>>;
  currentTenantId: string | null;
  refreshTenants: () => Promise<void>;
  refreshProperties: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<Role>('admin');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const { user } = useAuth() || {}; // Use default empty object if useAuth returns null during SSR
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  const fetchTenants = async () => {
    const tenantsFromDb = await getTenants();
    setTenants(tenantsFromDb);
  };
  
  const fetchProperties = async () => {
    const propertiesFromDb = await getProperties();
    setProperties(propertiesFromDb);
  };

  useEffect(() => {
    if(user) {
      fetchTenants();
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    // In a real app, you would fetch the user's role and tenant mapping
    // from your database based on their auth UID (user.uid)
    if (user) {
        // Simple logic for demo: if email contains 'tenant', they are a tenant.
        const isTenant = user.email?.includes('tenant');
        const userRole = isTenant ? 'tenant' : 'admin';
        setRole(userRole);

        if (isTenant) {
            // Find the tenant that matches the logged-in user's email
            const matchedTenant = tenants.find(t => t.contact === user.email);
            if (matchedTenant) {
                setCurrentTenantId(matchedTenant.tenantId);
            } else {
                 // For demo, if no match, default to first tenant
                setCurrentTenantId(tenants[0]?.tenantId || null);
            }
        } else {
            setCurrentTenantId(null);
        }
    } else {
        setRole('admin'); // Default role when not logged in
        setCurrentTenantId(null);
    }
  }, [user, tenants]);


  return (
    <AppContext.Provider value={{ 
        language, setLanguage, 
        role, setRole, 
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