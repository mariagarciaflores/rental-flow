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
import { useTranslation } from '@/lib/i18n';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Upload } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function PaymentForm() {
  const t = useTranslation();
  const { toast } = useToast();
  const context = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [fileName, setFileName] = useState('');

  const currentTenantId = 'tenant1'; // Simulated auth

  const { invoices, setInvoices } = context!;

  const pendingInvoices = useMemo(() => {
    return invoices.filter(inv => inv.tenantId === currentTenantId && inv.status !== 'PAID');
  }, [invoices, currentTenantId]);

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelection = selectedInvoices.includes(invoiceId)
      ? selectedInvoices.filter(id => id !== invoiceId)
      : [...selectedInvoices, invoiceId];
    setSelectedInvoices(newSelection);
    
    const totalSelected = invoices
      .filter(inv => newSelection.includes(inv.invoiceId))
      .reduce((sum, inv) => sum + (inv.totalDue - (inv.submittedPaymentAmount || 0)), 0);
    setPaymentAmount(totalSelected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };
  
  const handleSubmit = () => {
    const totalDueSelected = invoices
      .filter(inv => selectedInvoices.includes(inv.invoiceId))
      .reduce((sum, inv) => sum + inv.totalDue, 0);

    const newStatus: InvoiceStatus = paymentAmount >= totalDueSelected ? 'PAID' : 'PARTIAL';

    setInvoices(prev => prev.map(inv => {
      if (selectedInvoices.includes(inv.invoiceId)) {
        return {
          ...inv,
          status: newStatus,
          paymentProofUrl: PlaceHolderImages[0].imageUrl, // Simulated upload
          submittedPaymentAmount: (inv.submittedPaymentAmount || 0) + paymentAmount, // simplistic for demo
          submissionDate: new Date().toISOString(),
        };
      }
      return inv;
    }));

    toast({
      title: 'Payment Submitted',
      description: 'Your payment is being processed for verification.',
    });

    setOpen(false);
    setSelectedInvoices([]);
    setPaymentAmount(0);
    setFileName('');
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
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
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{t('form.month')}</TableHead>
                                <TableHead className="text-right">{t('table.header.total_due')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingInvoices.map(inv => (
                                <TableRow key={inv.invoiceId}>
                                    <TableCell><Checkbox checked={selectedInvoices.includes(inv.invoiceId)} onCheckedChange={() => handleSelectInvoice(inv.invoiceId)} /></TableCell>
                                    <TableCell>{inv.month}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(inv.totalDue - (inv.submittedPaymentAmount || 0))}</TableCell>
                                </TableRow>
                            ))}
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
