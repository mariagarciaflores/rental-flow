'use client';
import { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import type { Invoice, Tenant, Property, User } from '@/lib/types';
import { useAuth } from './AuthContext';
import { getTenants, getProperties, getUser, getInvoices } from '@/lib/firebase/firestore';

export type Language = 'en' | 'es';
export type Role = 'owner' | 'tenant';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  role: Role | null;
  setRole: (role: Role) => void;
  invoices: Invoice[];
  setInvoices: Dispatch<SetStateAction<Invoice[]>>;
  tenants: (Tenant & { user?: User })[]; // Tenant contract with user details
  setTenants: Dispatch<SetStateAction<(Tenant & { user?: User })[]>>;
  properties: Property[];
  setProperties: Dispatch<SetStateAction<Property[]>>;
  currentTenantId: string | null; // This now refers to the TENANCY ID from the 'tenants' collection
  currentUser: User | null;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<Role | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<(Tenant & { user?: User })[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { user: authUser, authKey } = useAuth() || {};

  const refreshData = useCallback(async () => {
    if (!authUser) return;

    try {
        const [tenantsFromDb, propertiesFromDb, invoicesFromDb, userFromDb] = await Promise.all([
            getTenants(),
            getProperties(),
            getInvoices(),
            getUser(authUser.uid),
        ]);

        if (userFromDb) {
            setCurrentUser(userFromDb);
            const primaryRole = userFromDb.roles.includes('owner') ? 'owner' : userFromDb.roles[0];
            setRole(primaryRole);

            if (primaryRole === 'tenant') {
                const userTenancy = tenantsFromDb.find(t => t.userId === authUser.uid);
                setCurrentTenantId(userTenancy ? userTenancy.id : null);
            } else {
                setCurrentTenantId(null);
            }
        } else {
            // Default to owner if no user doc, for dev purposes
            setRole('owner');
        }

        const usersForTenants = await Promise.all(
            tenantsFromDb.map(t => getUser(t.userId))
        );

        const tenantsWithUsers = tenantsFromDb.map((tenant, index) => ({
            ...tenant,
            user: usersForTenants[index] || undefined
        }));

        setTenants(tenantsWithUsers);
        setProperties(propertiesFromDb);
        setInvoices(invoicesFromDb);

    } catch (error) {
        console.error("Error initializing app data:", error);
        // Reset state on error
        setRole(null);
        setCurrentUser(null);
        setCurrentTenantId(null);
        setTenants([]);
        setProperties([]);
        setInvoices([]);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      refreshData();
    } else {
      // Reset state on logout
      setRole(null);
      setCurrentUser(null);
      setCurrentTenantId(null);
      setTenants([]);
      setProperties([]);
      setInvoices([]);
    }
  }, [authUser, authKey, refreshData]);
  
  const handleSetRole = (newRole: Role) => {
    // This function is primarily for the dev-mode role switcher.
    setRole(newRole);
     if (newRole === 'tenant') {
        const userTenancy = tenants.find(t => t.userId === authUser?.uid);
        setCurrentTenantId(userTenancy ? userTenancy.id : (tenants[0]?.id || null));
    } else {
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
        currentUser,
        refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}
