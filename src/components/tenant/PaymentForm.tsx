'use client';

import { useState, useContext, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Upload } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
export function PaymentForm() {
  const t = useTranslation();
  const { toast } = useToast();
  const context = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [fileName, setFileName] = useState('');

  const { invoices, refreshData, currentUser } = context || { invoices: [], refreshData: async () => {}, currentUser: null };

  const pendingInvoices = useMemo(() => {
    if (!currentUser) return [];
    return invoices.filter(inv => inv.userId === currentUser.id && inv.status !== 'paid');
  }, [invoices, currentUser]);

  if (!context) return null;

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelection = selectedInvoices.includes(invoiceId)
      ? selectedInvoices.filter(id => id !== invoiceId)
      : [...selectedInvoices, invoiceId];
    setSelectedInvoices(newSelection);
    
    const totalSelected = invoices
      .filter(inv => newSelection.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.totalDue - (inv.submittedPaymentAmount || 0)), 0);
    setPaymentAmount(totalSelected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };
  
  const handleSubmit = async () => {
    try {
        const batch = writeBatch(db);
        selectedInvoices.forEach(invoiceId => {
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const invoice = invoices.find(i => i.id === invoiceId);
            if (!invoice) return;

            const remainingBalance = invoice.totalDue - (invoice.submittedPaymentAmount || 0);
            const paymentForThisInvoice = Math.min(remainingBalance, paymentAmount / selectedInvoices.length);

            batch.update(invoiceRef, {
                status: 'pending',
                paymentProofUrl: PlaceHolderImages[0].imageUrl, // Simulated upload
                submittedPaymentAmount: (invoice.submittedPaymentAmount || 0) + paymentForThisInvoice,
                submissionDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });

        await batch.commit();

        toast({
          title: 'Payment Submitted',
          description: 'Your payment has been submitted for verification by the property manager.',
        });

        await refreshData();
        setOpen(false);
        setSelectedInvoices([]);
        setPaymentAmount(0);
        setFileName('');

    } catch (error) {
        console.error("Payment submission failed:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to submit payment. Please try again."
        });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={pendingInvoices.length === 0}>
          <CreditCard className="mr-2 h-4 w-4" />
          {t('action.submit_payment')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('action.submit_payment')}</DialogTitle>
          <DialogDescription>{t('form.select_invoices')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Card>
                <CardContent className="p-0 max-h-60 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{t('form.month')}</TableHead>
                                <TableHead className="text-right">{t('table.header.total_due')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingInvoices.map(inv => {
                                const remainingBalance = inv.totalDue - (inv.submittedPaymentAmount || 0);
                                const isPayable = remainingBalance > 0;
                                return (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedInvoices.includes(inv.id)} 
                                            onCheckedChange={() => handleSelectInvoice(inv.id)}
                                            disabled={!isPayable}
                                        />
                                    </TableCell>
                                    <TableCell>{inv.month}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(remainingBalance)}</TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">{t('form.payment_amount')}</Label>
                <Input id="amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receipt" className="text-right">{t('form.payment_receipt')}</Label>
                <div className="col-span-3">
                    <Button asChild variant="outline">
                        <label htmlFor="receipt-upload" className="cursor-pointer flex items-center">
                            <Upload className="mr-2 h-4 w-4" />
                            {t('form.upload_receipt')}
                            <Input id="receipt-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                        </label>
                    </Button>
                    {fileName && <p className="text-sm text-muted-foreground mt-2">{fileName}</p>}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button type="submit" onClick={handleSubmit} disabled={selectedInvoices.length === 0 || !fileName}>{t('action.submit_payment')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
