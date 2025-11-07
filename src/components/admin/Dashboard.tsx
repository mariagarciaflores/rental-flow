'use client';
import { useContext, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { expenses as expenseData } from '@/lib/data';
import { Bell, ArrowUpRight, ArrowDownRight, Banknote } from 'lucide-react';
import PaymentVerificationDialog from './PaymentVerificationDialog';

export default function AdminDashboard() {
  const t = useTranslation();
  const context = useContext(AppContext);
  if (!context) return null;

  const { invoices } = context;

  const unverifiedPayments = invoices.filter(
    (invoice) => invoice.status === 'PENDING' && invoice.paymentProofUrl
  );

  const { totalIncome, totalOutstanding } = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        if (invoice.status === 'PAID') {
          acc.totalIncome += invoice.totalDue;
        } else {
          acc.totalOutstanding += invoice.totalDue - (invoice.submittedPaymentAmount || 0);
        }
        return acc;
      },
      { totalIncome: 0, totalOutstanding: 0 }
    );
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenseData.reduce((acc, expense) => acc + expense.amount, 0);
  }, [expenseData]);

  const totalSavings = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('report.cash_flow')}</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
          <p className="text-xs text-muted-foreground">{t('report.total_savings')}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-green-600"><ArrowUpRight className="h-4 w-4 mr-1"/>{t('report.total_income')}</span>
              <span>{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-red-600"><ArrowDownRight className="h-4 w-4 mr-1"/>{t('report.total_expenses')}</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('report.income_summary')}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">{t('report.collected')}</p>
            <div className="mt-4">
                <div className="text-lg font-semibold text-amber-600">{formatCurrency(totalOutstanding)}</div>
                <p className="text-xs text-muted-foreground">{t('report.outstanding')}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('notifications.unverified_payments')}</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {unverifiedPayments.length > 0 ? (
            <ul className="space-y-4">
              {unverifiedPayments.map((invoice) => (
                <li key={invoice.invoiceId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{context.tenants.find(t => t.tenantId === invoice.tenantId)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('form.month')}: {invoice.month} - {formatCurrency(invoice.submittedPaymentAmount || 0)}
                    </p>
                  </div>
                  <PaymentVerificationDialog invoice={invoice} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No unverified payments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
