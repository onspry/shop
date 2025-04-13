// Base ViewModel for user information - used throughout the app
export interface UserViewModel {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
    provider: string;
    providerId: string;
    isAdmin: boolean;
    emailVerified: boolean;
    status: string;
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
    // Future profile/payment related fields would go here
}
