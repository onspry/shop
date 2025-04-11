// ViewModel for basic user information
export interface UserViewModel {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
    isAdmin: boolean;
    emailVerified: boolean;
    status: string;
}

// ViewModel for detailed user information
export interface UserDetailViewModel extends UserViewModel {
    provider: string;
    providerId: string;
    stripeCustomerId?: string | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
} 