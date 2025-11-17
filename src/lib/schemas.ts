import { z } from 'zod';

export const TenantSchemaForCreation = z.object({
    name: z.string().min(1, { message: 'El nombre del inquilino es requreido' }),
    email: z.string().email({ message: 'El email debe ser válido' }),
    phone: z.string().regex(/^\+/, { message: 'El teléfono debe incluir el código de país (ej. +1...)' }),
    propertyId: z.string().min(1, { message: 'Property is required' }),
    fixedMonthlyRent: z.number().min(0, { message: 'La renta no debe ser un número negativo' }),
    paysUtilities: z.boolean(),
    startDate: z.string().min(1, { message: 'La fecha de inicio es requerida' }),
});


export const TenantSchemaForEditing = TenantSchemaForCreation.omit({ email: true, name: true });
