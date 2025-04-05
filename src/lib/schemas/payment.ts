import { z } from 'zod';

// Basic payment form schema
export const paymentSchema = z.object({
    cardNumber: z.string().min(1, 'Card number is required').refine(
        (val) => /^\d{16}$/.test(val.replace(/\s/g, '')),
        'Card number must be 16 digits'
    ),
    cardHolder: z.string().min(1, 'Cardholder name is required'),
    expiryDate: z.string().min(1, 'Expiry date is required')
        .refine(
            (val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val),
            'Expiry date must be in MM/YY format'
        ),
    cvv: z.string().min(1, 'CVV is required')
        .refine(
            (val) => /^\d{3,4}$/.test(val),
            'CVV must be 3 or 4 digits'
        ),
    savePaymentMethod: z.boolean().default(false)
});

export type PaymentSchema = typeof paymentSchema; 