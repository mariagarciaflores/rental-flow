
'use server';

import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { TenantSchemaForCreation, TenantSchemaForEditing } from '@/lib/schemas';
import { verifyPaymentReceipt, VerifyPaymentReceiptInput } from '@/ai/flows/verify-payment-receipt';

const VerifyReceiptActionInputSchema = z.object({
  invoiceId: z.string(),
  expectedAmount: z.number(),
  tenantName: z.string(),
  propertyName: z.string(),
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

export async function createTenantAction(tenantData: z.infer<typeof TenantSchemaForCreation>): Promise<{success: boolean, link?: string, error?: string}> {
    try {
        const validatedData = TenantSchemaForCreation.parse(tenantData);

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: validatedData.email,
            emailVerified: false, 
            displayName: validatedData.name,
        });

        // 2. Add tenant data to Firestore
        const tenantsCol = adminDb.collection('tenants');
        await tenantsCol.add({
            ...validatedData,
            authUid: userRecord.uid, // Link to the auth user
        });

        // 3. Generate password reset link (which is used for initial password setup)
        const link = await adminAuth.generatePasswordResetLink(validatedData.email);

        return { success: true, link: link };

    } catch (error: any) {
        console.error("Failed to save tenant: ", error);
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


export async function updateTenantAction(tenantId: string, tenantData: z.infer<typeof TenantSchemaForEditing>): Promise<{success: boolean; error?: string}> {
    try {
        const validatedData = TenantSchemaForEditing.parse(tenantData);
        const tenantRef = adminDb.collection("tenants").doc(tenantId);
        await tenantRef.update(validatedData);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update tenant:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function deleteTenantAction(tenantId: string): Promise<{success: boolean; error?: string}> {
    try {
        // Here you would also delete the corresponding Firebase Auth user
        // const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
        // const tenantData = tenantDoc.data();
        // if (tenantData?.authUid) {
        //   await adminAuth.deleteUser(tenantData.authUid);
        // }
        const tenantRef = adminDb.collection("tenants").doc(tenantId);
        await tenantRef.delete();
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete tenant:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function addPropertyAction(property: Omit<any, 'propertyId' | 'adminId'>, adminId: string): Promise<any> {
    const newProperty = { ...property, adminId }; 
    const propertiesCol = adminDb.collection("properties");
    const docRef = await propertiesCol.add(newProperty);
    return { propertyId: docRef.id, ...newProperty };
}

export async function updatePropertyAction(propertyId: string, propertyData: Partial<any>): Promise<{success: boolean; error?: string}> {
    try {
        const propertyRef = adminDb.collection("properties").doc(propertyId);
        await propertyRef.update(propertyData);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update property:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function deletePropertyAction(propertyId: string): Promise<{success: boolean; error?: string}> {
    try {
        const propertyRef = adminDb.collection("properties").doc(propertyId);
        await propertyRef.delete();
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete property:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
