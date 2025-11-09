'use client';

import { useState, useContext, useTransition } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ShieldCheck, ShieldX } from 'lucide-react';
import { useTranslation, TranslationKey } from '@/lib/i18n';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { verifyReceiptAction } from '@/app/actions';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import type { VerifyPaymentReceiptOutput } from '@/ai/flows/verify-payment-receipt';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function PaymentVerificationDialog({ invoice }: { invoice: Invoice }) {
  const t = useTranslation();
  const { toast } = useToast();
  const context = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [verificationResult, setVerificationResult] = useState<VerifyPaymentReceiptOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!context) return null;
  const { tenants, properties, refreshData } = context;

  const tenancy = tenants.find(t => t.id === invoice.tenantId);
  const tenantUser = tenancy?.user;
  const property = properties.find(p => p.id === invoice.propertyId);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleVerify = () => {
    setError(null);
    setVerificationResult(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('invoiceId', invoice.id);
      formData.append('expectedAmount', invoice.totalDue.toString());
      formData.append('tenantName', tenantUser?.name || 'N/A');
      formData.append('propertyName', property?.name || 'N/A');
      
      const result = await verifyReceiptAction(formData);

      if (result.success) {
        setVerificationResult(result.data!);
      } else {
        setError(result.error || t('verification.error'));
      }
    });
  };

  const handleStatusUpdate = async (status: 'paid' | 'pending') => {
    const invoiceRef = doc(db, 'invoices', invoice.id);
    try {
        const updatePayload: any = {
            status: status,
            updatedAt: new Date().toISOString(),
        };

        if (status === 'paid') {
            updatePayload.paymentDate = new Date().toISOString();
        } else { // If rejecting payment
            updatePayload.paymentProofUrl = null;
            updatePayload.submittedPaymentAmount = null;
            updatePayload.submissionDate = null;
        }

        await updateDoc(invoiceRef, updatePayload);
        
        await refreshData(); // Refresh all data
        
        toast({
          title: status === 'paid' ? t('verification.success') : t('verification.rejected'),
        });
        setOpen(false);

    } catch (e) {
        console.error("Failed to update invoice status:", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update invoice status."
        });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('notifications.view')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('verification.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('verification.details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p><strong>{t('table.header.tenant')}:</strong> {tenantUser?.name}</p>
                <p><strong>{t('form.month')}:</strong> {invoice.month}</p>
                <p><strong>{t('table.header.total_due')}:</strong> {formatCurrency(invoice.totalDue)}</p>
                <p><strong>{t('verification.submitted_amount')}:</strong> {formatCurrency(invoice.submittedPaymentAmount || 0)}</p>
                <p><strong>{t('table.header.status')}:</strong> <Badge variant="destructive">{t(`status.${invoice.status.toLowerCase()}` as TranslationKey)}</Badge></p>
              </CardContent>
            </Card>
            
            {verificationResult && (
              <Alert className="mt-4" variant={verificationResult.isAccurate ? 'default' : 'destructive'}>
                {verificationResult.isAccurate ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                <AlertTitle>{t('verification.result')}</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                    <p><strong>{t('verification.accurate')}:</strong> {verificationResult.isAccurate ? 'Yes' : 'No'}</p>
                    {verificationResult.extractedAmount && <p><strong>{t('verification.extracted_amount')}:</strong> {formatCurrency(verificationResult.extractedAmount)}</p>}
                    <p><strong>{t('verification.notes')}:</strong> {verificationResult.notes}</p>
                </AlertDescription>
              </Alert>
            )}
            {error && <Alert variant="destructive" className="mt-4"><AlertTitle>{t('verification.error')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('verification.receipt')}</CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.paymentProofUrl && (
                  <Image src={invoice.paymentProofUrl} alt="Payment Receipt" width={400} height={600} className="rounded-md w-full h-auto" data-ai-hint="receipt"/>
                )}
                <Button onClick={handleVerify} disabled={isPending} className="w-full mt-4 bg-primary hover:bg-primary/90">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {t('verification.verify_ai')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="mt-6">
            <Button variant="destructive" onClick={() => handleStatusUpdate('pending')}>{t('action.reject_payment')}</Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('paid')}>{t('action.mark_paid')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
