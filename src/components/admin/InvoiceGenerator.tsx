'use client';

import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { FilePlus2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { adminDb } from '@/lib/firebase/admin';
import { collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Invoice } from '@/lib/types';


async function generateInvoicesInFirestore(invoices: Omit<Invoice, 'id'>[]) {
    const batch = writeBatch(db);
    const invoicesCol = collection(db, "invoices");

    invoices.forEach(invoiceData => {
        const newInvoiceRef = doc(invoicesCol);
        batch.set(newInvoiceRef, invoiceData);
    });

    await batch.commit();
}


export function InvoiceGenerator() {
  const t = useTranslation();
  const { toast } = useToast();
  const context = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  if (!context) return null;
  const { tenants, invoices, refreshData } = context;

  const handleGenerate = async () => {
    const monthYear = `${selectedYear}-${selectedMonth}`;
    const now = new Date().toISOString();

    const newInvoicesData = tenants.filter(t => t.active).map(tenancy => {
       const alreadyExists = invoices.some(inv => inv.tenantId === tenancy.id && inv.month === monthYear);
       if (alreadyExists) return null;

       return {
            tenantId: tenancy.id,
            userId: tenancy.userId,
            propertyId: tenancy.propertyId,
            month: monthYear,
            rentAmount: tenancy.fixedMonthlyRent,
            utilitiesAmount: 0, // Admin can edit this later
            totalDue: tenancy.fixedMonthlyRent,
            status: 'pending' as const,
            paymentDate: null,
            createdAt: now,
            updatedAt: now,
       };
    }).filter(Boolean) as Omit<Invoice, 'id'>[];

    if (newInvoicesData.length === 0) {
        toast({
            title: "No Invoices to Generate",
            description: `All active tenants already have an invoice for ${monthYear}.`,
        });
        setOpen(false);
        return;
    }

    try {
        const batch = writeBatch(db);
        const invoicesCol = collection(db, "invoices");

        newInvoicesData.forEach(invoiceData => {
            const newInvoiceRef = doc(invoicesCol);
            batch.set(newInvoiceRef, invoiceData);
        });

        await batch.commit();
        
        await refreshData();
        
        toast({
          title: `${t('invoice_generator.success')} ${monthYear}`,
          description: `${newInvoicesData.length} new invoices were created.`,
        });
        setOpen(false);
    } catch (error) {
        console.error("Error generating invoices: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate invoices. Please try again."
        });
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'),
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 className="mr-2 h-4 w-4" />
          {t('action.generate_invoices')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('invoice_generator.title')}</DialogTitle>
          <DialogDescription>{t('invoice_generator.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">{t('form.month')}</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month" className="col-span-3">
                    <SelectValue placeholder={t('form.select_month')} />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">{t('form.year')}</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year" className="col-span-3">
                    <SelectValue placeholder={t('form.select_year')} />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button type="submit" onClick={handleGenerate}>{t('action.generate_invoices')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
