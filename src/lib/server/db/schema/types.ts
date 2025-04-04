export const Providers = {
    CREDENTIALS: 'credentials',
    GOOGLE: 'google',
    GITHUB: 'github',
    EMAIL: 'email'
} as const;

export type Provider = typeof Providers[keyof typeof Providers];

export const userStatus = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof userStatus[number];

export const orderStatus = [
    'pending_payment',
    'payment_failed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
] as const;

export type OrderStatus = typeof orderStatus[number];

export const cartStatus = ['active', 'merged', 'converted_to_order', 'abandoned'] as const;
export type CartStatus = typeof cartStatus[number]; 