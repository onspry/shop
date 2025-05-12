import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { RequestEvent } from "@sveltejs/kit";
import { prisma } from '$lib/server/db';
import type { User } from '@prisma/client';

import { generateRandomOTP } from "./utils";
import { sendVerificationEmail } from './email-verification';


// Cookie name constant to ensure consistency
export const PASSWORD_RESET_COOKIE_NAME = "password_reset_session";

export async function createPasswordResetSession(token: string, userId: string, email: string): Promise<PasswordResetSession> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
    const code = generateRandomOTP();

    try {
        const prismaSession = await prisma.passwordResetSession.create({
            data: {
                id: sessionId,
                userId: userId,
                email: email,
                code: code,
                expiresAt: expiresAt,
                emailVerified: false
            }
        });

        // Convert to our interface format
        const session: PasswordResetSession = {
            id: prismaSession.id,
            userId: prismaSession.userId,
            email: prismaSession.email,
            code: prismaSession.code,
            expiresAt: prismaSession.expiresAt,
            emailVerified: prismaSession.emailVerified
        };

        return session;
    } catch (error) {
        console.error("[Password Reset] Error creating session:", error);
        throw error;
    }
}

export async function validatePasswordResetSessionToken(token: string): Promise<PasswordResetSessionValidationResult> {
    try {
        const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
        console.log("[Password Reset] Validating session token for ID:", sessionId);

        const prismaSession = await prisma.passwordResetSession.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });

        if (!prismaSession) {
            console.log("[Password Reset] No session found for token");
            return { session: null, user: null };
        }

        // Check if session is expired
        if (Date.now() >= prismaSession.expiresAt.getTime()) {
            console.log("[Password Reset] Session expired");
            await prisma.passwordResetSession.delete({
                where: { id: sessionId }
            });
            return { session: null, user: null };
        }

        // Convert to our interface format
        const session: PasswordResetSession = {
            id: prismaSession.id,
            userId: prismaSession.userId,
            email: prismaSession.email,
            code: prismaSession.code,
            expiresAt: prismaSession.expiresAt,
            emailVerified: prismaSession.emailVerified
        };

        const dbUser = prismaSession.user;
        const user: User = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            image: dbUser.image,
            emailVerified: dbUser.emailVerified,
            isAdmin: dbUser.isAdmin,
            provider: dbUser.provider,
            providerId: dbUser.providerId,
            passwordHash: dbUser.passwordHash || '',
            stripeCustomerId: dbUser.stripeCustomerId || `email_${dbUser.id}`,
            status: dbUser.status,
            lastLoginAt: dbUser.lastLoginAt || new Date(),
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt
        };

        console.log("[Password Reset] Valid session found for email:", session.email);
        return { session, user };
    } catch (error) {
        console.error("[Password Reset] Error validating token:", error);
        return { session: null, user: null };
    }
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string): Promise<void> {
    await prisma.passwordResetSession.update({
        where: { id: sessionId },
        data: { emailVerified: true }
    });
}

export async function invalidateUserPasswordResetSessions(userId: string): Promise<void> {
    await prisma.passwordResetSession.deleteMany({
        where: { userId: userId }
    });
}

export async function validatePasswordResetSessionRequest(event: RequestEvent): Promise<PasswordResetSessionValidationResult> {
    const token = event.cookies.get(PASSWORD_RESET_COOKIE_NAME) ?? null;
    console.log("[Password Reset] Validating request, token exists:", !!token);

    if (token === null) {
        return { session: null, user: null };
    }

    const result = await validatePasswordResetSessionToken(token);
    if (result.session === null) {
        deletePasswordResetSessionTokenCookie(event);
    }
    return result;
}

export async function storePasswordResetToken(event: RequestEvent, token: string): Promise<void> {
    console.log("[Password Reset] Setting session cookie");
    event.cookies.set(PASSWORD_RESET_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        domain: '', // Explicitly set empty domain for same-origin only
        path: "/",
        sameSite: "lax"
    });
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
    console.log("[Password Reset] Deleting session cookie");
    event.cookies.set(PASSWORD_RESET_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        domain: '', // Explicitly set empty domain for same-origin only
        path: "/",
        sameSite: "lax"
    });
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
    try {
        console.log(`[Password Reset] Sending reset code to ${email}: ${code}`);
        await sendVerificationEmail(email, code);
    } catch (error) {
        console.error("[Password Reset] Error sending email:", error);
        // Log the error but don't throw, as we still want to continue the flow
        // The code is logged to the console in development
    }
}

/**
 * Interface for password reset session
 */
export interface PasswordResetSession {
    id: string;
    userId: string;
    email: string;
    expiresAt: Date;
    code: string;
    emailVerified: boolean;
}

/**
 * Result of validating a password reset session
 */
export type PasswordResetSessionValidationResult =
    | { session: PasswordResetSession; user: User }
    | { session: null; user: null };