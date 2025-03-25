import { z } from 'zod';

export const registerSchema = z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' })
});

export type RegisterSchema = z.infer<typeof registerSchema>;

// Additional schemas can be added here for login, password reset, etc.
export const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
    redirectTo: z.string().optional()
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const passwordResetSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' })
});

export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;

export const verificationCodeSchema = z.object({
    code: z.string().min(1, { message: 'Verification code is required' })
});

export type VerificationCodeSchema = z.infer<typeof verificationCodeSchema>;

export const passwordUpdateSchema = z.object({
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
});

export type PasswordUpdateSchema = z.infer<typeof passwordUpdateSchema>; 