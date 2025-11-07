import { z } from 'zod';

export const TenantSchemaForCreation = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().optional(),
    propertyId: z.string().min(1, { message: 'Property is required' }),
    fixedMonthlyRent: z.number().min(0, { message: 'Rent must be a positive number' }),
    paysUtilities: z.boolean(),
});


export const TenantSchemaForEditing = TenantSchemaForCreation.omit({ email: true });
