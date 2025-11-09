'use client';
import { AppProvider, AppContext } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useContext } from 'react';
import Header from '@/components/layout/Header';
import AdminView from '@/components/admin/AdminView';
import TenantView from '@/components/tenant/TenantView';
import LoginView from '@/components/auth/LoginView';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const context = useContext(AppContext);
  const { user, loading } = useAuth()!;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Also check if context or role is not yet determined
  if (!context || context.role === null) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const { role } = context;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {role === 'owner' ? <AdminView /> : <TenantView />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
