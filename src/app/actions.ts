'use server';

import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { TenantSchemaForCreation, TenantSchemaForEditing } from '@/lib/schemas';
import { verifyPaymentReceipt, VerifyPaymentReceiptInput } from '@/ai/flows/verify-payment-receipt';
import type { User, Tenant, Property } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

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
        const now = new Date().toISOString();

        // 1. Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: validatedData.email,
            emailVerified: false, 
            displayName: validatedData.name,
        });
        
        const batch = adminDb.batch();
        const userId = userRecord.uid;

        // 2. Add user data to 'users' collection with role
        const userRef = adminDb.collection('users').doc(userId);
        const newUser: Omit<User, 'id'> = {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone || '',
            roles: ['tenant'],
            createdAt: now,
            updatedAt: now
        };
        batch.set(userRef, newUser);

        // 3. Add tenancy data to 'tenants' collection
        const tenantRef = adminDb.collection('tenants').doc(); // Auto-generate ID
        const newTenant: Omit<Tenant, 'id'> = {
            userId: userId,
            propertyId: validatedData.propertyId,
            fixedMonthlyRent: validatedData.fixedMonthlyRent,
            paysUtilities: validatedData.paysUtilities,
            startDate: validatedData.startDate,
            endDate: null,
            active: true,
            createdAt: now,
            updatedAt: now
        };
        batch.set(tenantRef, newTenant);

        await batch.commit();

        // 4. Generate password reset link for initial password setup
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
        
        const updatePayload = {
            ...validatedData,
            updatedAt: new Date().toISOString()
        };
        
        await tenantRef.update(updatePayload);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update tenant:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function deleteTenantAction(userId: string, tenantId: string): Promise<{success: boolean; error?: string}> {
    try {
        const batch = adminDb.batch();
        
        // Delete auth user
        await adminAuth.deleteUser(userId);
        
        // Delete firestore docs
        const tenantRef = adminDb.collection("tenants").doc(tenantId);
        const userRef = adminDb.collection("users").doc(userId);

        batch.delete(tenantRef);
        batch.delete(userRef);
        
        // Optional: Also delete associated invoices? For now, we leave them.

        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete tenant:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}


export async function generateAndCopyTenantPasswordLinkAction(email: string): Promise<{success: boolean; link?: string; error?: string;}> {
    try {
        const link = await adminAuth.generatePasswordResetLink(email);
        return { success: true, link };
    } catch (error: any) {
        console.error("Failed to generate password reset link:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function addPropertyAction(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string): Promise<{ id: string } & Omit<Property, 'id'>> {
    const now = new Date().toISOString();
    const newPropertyData = {
        ...property,
        owners: [ownerId],
        createdAt: now,
        updatedAt: now,
    };
    const docRef = await adminDb.collection("properties").add(newPropertyData);
    return { id: docRef.id, ...newPropertyData };
}

export async function updatePropertyAction(propertyId: string, propertyData: Partial<Property>): Promise<{success: boolean; error?: string}> {
    try {
        const propertyRef = adminDb.collection("properties").doc(propertyId);
        await propertyRef.update({
            ...propertyData,
            updatedAt: new Date().toISOString()
        });
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
