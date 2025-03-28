export const Providers = {
    CREDENTIALS: 'credentials',
    GOOGLE: 'google',
    GITHUB: 'github',
    GUEST: 'guest'
} as const;

export type Provider = typeof Providers[keyof typeof Providers];

export const userStatus = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof userStatus[number]; 