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

const UserDocumentSchema = z.object({
    uid: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
});

export async function createUserDocumentAction(userData: z.infer<typeof UserDocumentSchema>): Promise<{success: boolean; error?: string;}> {
    try {
        const validatedData = UserDocumentSchema.parse(userData);
        const now = new Date().toISOString();
        const userRef = adminDb.collection('users').doc(validatedData.uid);
        
        const newUser: Omit<User, 'id'> = {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone || '',
            roles: ['owner', 'tenant'], // Assign both roles on signup
            createdAt: now,
            updatedAt: now
        };

        await userRef.set(newUser);
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to create user document:", error);
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred creating the user document.";
        return { success: false, error: errorMessage };
    }
}


export async function createTenantAction(tenantData: z.infer<typeof TenantSchemaForCreation>): Promise<{success: boolean, link?: string, error?: string}> {
    try {
        const validatedData = TenantSchemaForCreation.parse(tenantData);
        const now = new Date().toISOString();
        const usersRef = adminDb.collection('users');
        const tenantsRef = adminDb.collection('tenants');
        const batch = adminDb.batch();

        // 1. Check if user already exists
        const userQuery = await usersRef.where('email', '==', validatedData.email).limit(1).get();
        let userId: string;
        let link: string | undefined = undefined;
        
        if (!userQuery.empty) {
            // User exists
            const existingUser = userQuery.docs[0];
            userId = existingUser.id;
            const userData = existingUser.data() as User;

            // Ensure user has 'tenant' role
            if (!userData.roles.includes('tenant')) {
                const userRef = usersRef.doc(userId);
                batch.update(userRef, {
                    roles: FieldValue.arrayUnion('tenant'),
                    updatedAt: now,
                });
            }
        } else {
            // User does not exist, create new user in Auth and Firestore
            const userRecord = await adminAuth.createUser({
                email: validatedData.email,
                emailVerified: false,
                displayName: validatedData.name,
            });
            userId = userRecord.uid;

            const userRef = usersRef.doc(userId);
            const newUser: Omit<User, 'id'> = {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone || '',
                roles: ['tenant'],
                createdAt: now,
                updatedAt: now,
            };
            batch.set(userRef, newUser);

            // Generate password reset link for the new user.
            // This call triggers Firebase's default email template if configured.
            // We get the link back but choose not to return it for security.
            link = await adminAuth.generatePasswordResetLink(validatedData.email);
        }
        
        // 2. Add tenancy data to 'tenants' collection
        const tenantRef = tenantsRef.doc(); // Auto-generate ID
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

        // Return a 'link' only if a new user was created, to signal the UI.
        return { success: true, link: link };

    } catch (error: any) {
        console.error("Failed to save tenant: ", error);
        let errorMessage = 'An unknown error occurred.';
        if (error.code === 'auth/email-already-exists' && !error.message.includes('userQuery')) { // Avoid shadowing our own logic
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
        // This is the function that generates the link on demand.
        const link = await adminAuth.generatePasswordResetLink(email);
        // It returns the link to the client to be shown in a toast.
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
