import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "./client";
import type { Tenant, Property } from "@/lib/types";

// Tenant Functions
export async function getTenants(): Promise<Tenant[]> {
    const tenantsCol = collection(db, "tenants");
    const tenantSnapshot = await getDocs(tenantsCol);
    const tenantList = tenantSnapshot.docs.map(doc => ({ tenantId: doc.id, ...doc.data() } as Tenant));
    return tenantList;
}


// Property Functions
export async function getProperties(): Promise<Property[]> {
    const propertiesCol = collection(db, "properties");
    const propertySnapshot = await getDocs(propertiesCol);
    const propertyList = propertySnapshot.docs.map(doc => ({ propertyId: doc.id, ...doc.data() } as Property));
    return propertyList;
}

// User Role Function
export async function getUserRole(uid: string): Promise<'admin' | 'tenant' | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data().role;
        } else {
            // This case is important for users created directly in Firebase Auth console
            console.warn(`No user document found for UID: ${uid}. Role cannot be determined.`);
            return 'admin'; // Default to admin if no role doc, for development.
        }
    } catch (error) {
        console.error("Error fetching user role:", error);
        // If rules deny reading the user doc, this will also fail.
        // Defaulting to a safe, non-privileged role might be better in production.
        return null;
    }
}