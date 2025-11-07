'use client';
import { AppProvider, AppContext } from '@/contexts/AppContext';
import { useContext } from 'react';
import Header from '@/components/layout/Header';
import AdminView from '@/components/admin/AdminView';
import TenantView from '@/components/tenant/TenantView';

function App() {
  const context = useContext(AppContext);

  if (!context) {
    // This should not happen as App is always wrapped in AppProvider
    return null;
  }

  const { role } = context;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {role === 'admin' ? <AdminView /> : <TenantView />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
