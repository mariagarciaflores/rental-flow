'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import AdminDashboard from './Dashboard';
import TenantManagement from './Tenants';
import ExpenseManagement from './Expenses';
import PropertyList from './Properties';
import InvoiceManagement from './InvoiceManagement';
import { LayoutDashboard, Users, CreditCard, DollarSign, Building } from 'lucide-react';

export default function AdminView() {
  const t = useTranslation();
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2 h-4 w-4"/>{t('nav.dashboard')}</TabsTrigger>
        <TabsTrigger value="tenants"><Users className="mr-2 h-4 w-4"/>{t('nav.tenants')}</TabsTrigger>
        <TabsTrigger value="invoices"><CreditCard className="mr-2 h-4 w-4"/>{t('nav.invoices')}</TabsTrigger>
        <TabsTrigger value="expenses"><DollarSign className="mr-2 h-4 w-4"/>{t('nav.expenses')}</TabsTrigger>
        <TabsTrigger value="properties"><Building className="mr-2 h-4 w-4"/>{t('nav.properties')}</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6">
        <AdminDashboard />
      </TabsContent>
      <TabsContent value="tenants" className="mt-6">
        <TenantManagement />
      </TabsContent>
       <TabsContent value="invoices" className="mt-6">
        <InvoiceManagement />
      </TabsContent>
      <TabsContent value="expenses" className="mt-6">
        <ExpenseManagement />
      </TabsContent>
      <TabsContent value="properties" className="mt-6">
        <PropertyList />
      </TabsContent>
    </Tabs>
  );
}
