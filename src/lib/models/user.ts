export const UserStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const Provider = {
    EMAIL: 'email',
    GOOGLE: 'google',
    GITHUB: 'github',
    MICROSOFT: 'microsoft',
    FACEBOOK: 'facebook'
} as const;

export type Provider = typeof Provider[keyof typeof Provider];

// Base ViewModel for user information - used throughout the app
export interface UserViewModel {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
    provider: Provider;
    providerId: string;
    isAdmin: boolean;
    emailVerified: boolean;
    status: UserStatus;
}

// ViewModel for user creation/authentication - used in auth flows
export interface UserAuthViewModel extends UserViewModel {
    passwordHash?: string | null;
}

// Extended ViewModel for payment/profile features
export interface UserDetailViewModel extends UserViewModel {
    stripeCustomerId?: string | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
