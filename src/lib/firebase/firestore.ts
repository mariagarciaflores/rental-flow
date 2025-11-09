import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "./client";
import type { Tenant, Property, User, Invoice } from "@/lib/types";

// User Functions
export async function getUser(uid: string): Promise<User | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as User;
        } else {
            console.warn(`No user document found for UID: ${uid}.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// Tenant (Tenancy) Functions
export async function getTenants(): Promise<Tenant[]> {
    const tenantsCol = collection(db, "tenants");
    const tenantSnapshot = await getDocs(tenantsCol);
    const tenantList = tenantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
    return tenantList;
}

// Property Functions
export async function getProperties(): Promise<Property[]> {
    const propertiesCol = collection(db, "properties");
    const propertySnapshot = await getDocs(propertiesCol);
    const propertyList = propertySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    return propertyList;
}

// Invoice Functions
export async function getInvoices(): Promise<Invoice[]> {
    const invoicesCol = collection(db, "invoices");
    const invoiceSnapshot = await getDocs(invoicesCol);
    const invoiceList = invoiceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    return invoiceList;
}
