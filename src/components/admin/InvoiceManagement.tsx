'use client';

import { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppContext } from '@/contexts/AppContext';
import { useTranslation, TranslationKey } from '@/lib/i18n';
import type { InvoiceStatus } from '@/lib/types';
import { InvoiceGenerator } from './InvoiceGenerator';

export default function InvoiceManagement() {
  const t = useTranslation();
  const context = useContext(AppContext);

  if (!context) return null;

  const { invoices, tenants } = context;

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

  const getTenantName = (tenantId: string) => {
    return tenants.find(t => t.tenantId === tenantId)?.name || 'Unknown Tenant';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('nav.invoices')}</CardTitle>
        <InvoiceGenerator />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.header.month')}</TableHead>
              <TableHead>{t('table.header.tenant')}</TableHead>
              <TableHead className="text-right">{t('table.header.total_due')}</TableHead>
              <TableHead className="text-center">{t('table.header.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((invoice) => (
              <TableRow key={invoice.invoiceId}>
                <TableCell className="font-medium">{invoice.month}</TableCell>
                <TableCell>{getTenantName(invoice.tenantId)}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.totalDue)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(invoice.status)}>
                    {t(`status.${invoice.status.toLowerCase()}` as TranslationKey)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
