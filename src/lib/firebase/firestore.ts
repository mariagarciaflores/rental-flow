import { collection, getDocs, doc } from "firebase/firestore";
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
