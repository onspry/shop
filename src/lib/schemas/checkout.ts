import { z } from 'zod';

export const shippingSchema = z.object({
    firstName: z.string().min(2, { message: 'First name is required' }),
    lastName: z.string().min(2, { message: 'Last name is required' }),
    address: z.string().min(5, { message: 'Street address is required' }),
    apartment: z.string().optional(),
    city: z.string().min(2, { message: 'City is required' }),
    state: z.string().min(2, { message: 'State is required' }),
    zip: z.string().min(5, { message: 'Valid ZIP code is required' }),
    phone: z.string().min(10, { message: 'Valid phone number is required' })
});

export type ShippingSchema = typeof shippingSchema; 