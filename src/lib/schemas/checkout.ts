import { z } from 'zod';

export const shippingSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().optional(),
    shippingMethod: z.string().min(1, 'Shipping method is required'),
    saveAddress: z.boolean().default(false)
});

export type ShippingSchema = typeof shippingSchema;

export const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

export type EmailSchema = typeof emailSchema; 