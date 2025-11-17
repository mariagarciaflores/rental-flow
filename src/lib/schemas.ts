import { z } from 'zod';

// This schema is now simplified as client-side validation is handled in the component
// to support internationalization. This can be used for server-side validation if needed.
export const TenantSchemaForCreation = z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    propertyId: z.string(),
    fixedMonthlyRent: z.number(),
    paysUtilities: z.boolean(),
    startDate: z.string(),
});


export const TenantSchemaForEditing = z.object({
    propertyId: z.string(),
    fixedMonthlyRent: z.number(),
    paysUtilities: z.boolean(),
    startDate: z.string(),
    phone: z.string(),
});

    