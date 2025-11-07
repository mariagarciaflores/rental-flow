'use client';

import { useState, useContext, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppContext } from '@/contexts/AppContext';
import { useTranslation, TranslationKey } from '@/lib/i18n';
import type { InvoiceStatus, Invoice } from '@/lib/types';
import { PaymentForm } from './PaymentForm';
import { DollarSign, Info } from 'lucide-react';

export default function TenantDashboard() {
  const t = useTranslation();
  const context = useContext(AppContext);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const { invoices, currentTenantId } = context!;

  const tenantInvoices = useMemo(() => {
    if (!currentTenantId) return [];
    return invoices.filter(inv => inv.tenantId === currentTenantId);
  }, [invoices, currentTenantId]);

  const outstandingDebt = useMemo(() => {
    return tenantInvoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((acc, inv) => acc + (inv.totalDue - (inv.submittedPaymentAmount || 0)), 0);
  }, [tenantInvoices]);

  const filteredInvoices = useMemo(() => {
    return tenantInvoices
        .filter(inv => inv.month.startsWith(selectedYear))
        .sort((a,b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  }, [tenantInvoices, selectedYear]);
  
  const availableYears = useMemo(() => {
    const years = new Set(tenantInvoices.map(inv => inv.month.substring(0, 4)));
    return Array.from(years).sort().reverse();
  }, [tenantInvoices]);

  const getStatusVariant = (status: InvoiceStatus): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'PENDING':
        return 'destructive';
      case 'PARTIAL':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  if (!currentTenantId) {
    return (
        <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Could not find tenant information for the logged-in user.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('debt.outstanding')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{formatCurrency(outstandingDebt)}</div>
          </CardContent>
        </Card>
        <Alert className="md:col-span-2">
            <Info className="h-4 w-4"/>
            <AlertTitle>{t('form.payment_receipt')}</AlertTitle>
            <AlertDescription>
                {t('tenant.debt_notifications_active')}
            </AlertDescription>
        </Alert>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <CardTitle>{t('tenant.current_invoices')}</CardTitle>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={availableYears.length === 0}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('form.year')} />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <PaymentForm />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('form.month')}</TableHead>
                <TableHead className="text-right">{t('table.header.total_due')}</TableHead>
                <TableHead className="text-center">{t('table.header.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.invoiceId}>
                    <TableCell className="font-medium">{invoice.month}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.totalDue)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {t(`status.${invoice.status.toLowerCase()}` as TranslationKey)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t('tenant.no_invoices')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
