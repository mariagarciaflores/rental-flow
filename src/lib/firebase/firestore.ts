import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./client";
import type { Tenant, Property } from "@/lib/types";

// Tenant Functions
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

export async function deleteTenant(tenantId: string): Promise<void> {
    const tenantRef = doc(db, "tenants", tenantId);
    await deleteDoc(tenantRef);
}

// Property Functions
export async function getProperties(): Promise<Property[]> {
    const propertiesCol = collection(db, "properties");
    const propertySnapshot = await getDocs(propertiesCol);
    const propertyList = propertySnapshot.docs.map(doc => ({ propertyId: doc.id, ...doc.data() } as Property));
    return propertyList;
}

export async function addProperty(property: Omit<Property, 'propertyId' | 'adminId'>, adminId: string): Promise<Property> {
    const newProperty = { ...property, adminId }; 
    const propertiesCol = collection(db, "properties");
    const docRef = await addDoc(propertiesCol, newProperty);
    return { propertyId: docRef.id, ...newProperty };
}

export async function updateProperty(propertyId: string, propertyData: Partial<Property>): Promise<void> {
    const propertyRef = doc(db, "properties", propertyId);
    await updateDoc(propertyRef, propertyData);
}

export async function deleteProperty(propertyId: string): Promise<void> {
    const propertyRef = doc(db, "properties", propertyId);
    await deleteDoc(propertyRef);
}