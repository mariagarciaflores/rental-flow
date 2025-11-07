'use server';
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./client";
import type { Tenant } from "@/lib/types";

export async function getTenants(): Promise<Tenant[]> {
    const tenantsCol = collection(db, "tenants");
    const tenantSnapshot = await getDocs(tenantsCol);
    const tenantList = tenantSnapshot.docs.map(doc => ({ tenantId: doc.id, ...doc.data() } as Tenant));
    return tenantList;
}

export async function addTenant(tenant: Omit<Tenant, 'tenantId'>): Promise<Tenant> {
    const tenantsCol = collection(db, "tenants");
    const docRef = await addDoc(tenantsCol, tenant);
    return { tenantId: docRef.id, ...tenant };
}

export async function updateTenant(tenantId: string, tenantData: Partial<Tenant>): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);
    await updateDoc(tenantRef, tenantData);
}
