'use server';

import { verifyPaymentReceipt, VerifyPaymentReceiptInput } from '@/ai/flows/verify-payment-receipt';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { collection, addDoc } from 'firebase/firestore';

const VerifyReceiptActionInputSchema = z.object({
  invoiceId: z.string(),
  expectedAmount: z.number(),
  tenantName: z.string(),
  propertyName: z.string(),
});

const TenantSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  propertyId: z.string().min(1, { message: 'Property is required' }),
  fixedMonthlyRent: z.number().min(0, { message: 'Rent must be a positive number' }),
  paysUtilities: z.boolean(),
});

// A simple in-memory "database" of fake receipt data URIs
const receiptDataUris: Record<string, string> = {
  'inv2': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 black pixel
}

export async function verifyReceiptAction(formData: FormData) {
  try {
    const rawInput = {
      invoiceId: formData.get('invoiceId'),
      expectedAmount: Number(formData.get('expectedAmount')),
      tenantName: formData.get('tenantName'),
      propertyName: formData.get('propertyName'),
    };

    const validatedInput = VerifyReceiptActionInputSchema.parse(rawInput);
    
    // In a real app, you'd get this from a file upload and convert to data URI.
    // Here we simulate it.
    const receiptDataUri = receiptDataUris[validatedInput.invoiceId] || receiptDataUris['inv2'];

    const verificationInput: VerifyPaymentReceiptInput = {
      ...validatedInput,
      receiptDataUri,
    };

    const result = await verifyPaymentReceipt(verificationInput);

    return { success: true, data: result };
  } catch (error) {
    console.error("Verification action failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function createTenantAction(tenantData: z.infer<typeof TenantSchema>) {
    try {
        const validatedData = TenantSchema.parse(tenantData);

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: validatedData.email,
            emailVerified: false, // They will verify by setting password
            displayName: validatedData.name,
        });

        // 2. Add tenant data to Firestore
        const tenantsCol = collection(adminDb, 'tenants');
        await addDoc(tenantsCol, {
            ...validatedData,
            authUid: userRecord.uid, // Link to the auth user
        });

        // 3. Generate password reset link to allow user to set their password
        const link = await adminAuth.generatePasswordResetLink(validatedData.email);

        // 4. Send email (in a real app, use a proper email service like SendGrid, etc.)
        // For this demo, we'll just log the action and the link.
        console.log(`
            Tenant created: ${userRecord.uid}
            An email should be sent to ${validatedData.email} with the following link to set their password:
            ${link}
        `);
        // Here you would integrate with your email provider to send the link.

        return { success: true };

    } catch (error: any) {
        console.error("Create Tenant Action Failed: ", error);
        let errorMessage = 'An unknown error occurred.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'This email is already in use by another user.';
        } else if (error instanceof z.ZodError) {
            errorMessage = 'Validation failed: ' + error.errors.map(e => e.message).join(', ');
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}
