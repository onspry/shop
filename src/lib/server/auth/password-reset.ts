import { eq } from 'drizzle-orm';
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import type { RequestEvent } from "@sveltejs/kit";

import { db, type User } from '$lib/server/db_drizzle/schema';
import { passwordResetSession } from '$lib/server/db_drizzle/schema/password-reset-session';
import { user as userTable } from '$lib/server/db_drizzle/schema/user';

import { generateRandomOTP } from "./utils";
import { sendVerificationEmail } from './email-verification';


// Cookie name constant to ensure consistency
export const PASSWORD_RESET_COOKIE_NAME = "password_reset_session";

export function createPasswordResetSession(token: string, userId: string, email: string): PasswordResetSession {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: PasswordResetSession = {
        id: sessionId,
        userId,
        email,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        code: generateRandomOTP(),
        emailVerified: false,
        twoFactorVerified: false
    };

    try {
        db.insert(passwordResetSession).values({
            id: session.id,
            userId: session.userId,
            email: session.email,
            code: session.code,
            expiresAt: session.expiresAt,
            email_verified: session.emailVerified,
        }).run();

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

        const [result] = await db
            .select({
                session: passwordResetSession,
                user: userTable
            })
            .from(passwordResetSession)
            .innerJoin(userTable, eq(passwordResetSession.userId, userTable.id))
            .where(eq(passwordResetSession.id, sessionId));

        if (!result) {
            console.log("[Password Reset] No session found for token");
            return { session: null, user: null };
        }

        const { session: dbSession, user: dbUser } = result;

        const session: PasswordResetSession = {
            id: dbSession.id,
            userId: dbSession.userId,
            email: dbSession.email,
            code: dbSession.code,
            expiresAt: dbSession.expiresAt,
            emailVerified: dbSession.email_verified,
            twoFactorVerified: dbSession.twoFactorVerified
        };

        const user: User = {
            id: dbUser.id,
            email: dbUser.email,
            firstname: dbUser.firstname,
            lastname: dbUser.lastname,
            image: dbUser.image,
            emailVerified: dbUser.emailVerified,
            isAdmin: dbUser.isAdmin,
            provider: 'credentials',
            providerId: dbUser.id,
            passwordHash: '',
            stripeCustomerId: `email_${dbUser.id}`,
            status: 'active',
            lastLoginAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (Date.now() >= session.expiresAt.getTime()) {
            console.log("[Password Reset] Session expired");
            await db.delete(passwordResetSession)
                .where(eq(passwordResetSession.id, session.id));
            return { session: null, user: null };
        }

        console.log("[Password Reset] Valid session found for email:", session.email);
        return { session, user };
    } catch (error) {
        console.error("[Password Reset] Error validating token:", error);
        return { session: null, user: null };
    }
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string): Promise<void> {
    await db.update(passwordResetSession)
        .set({ email_verified: true })
        .where(eq(passwordResetSession.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: string): Promise<void> {
    await db.delete(passwordResetSession)
        .where(eq(passwordResetSession.userId, userId));
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

export function setPasswordResetSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
    console.log("[Password Reset] Setting session cookie");
    event.cookies.set(PASSWORD_RESET_COOKIE_NAME, token, {
        expires: expiresAt,
        sameSite: "lax",
        httpOnly: true,
        path: "/", // Ensure the cookie is available for all paths
        secure: !import.meta.env.DEV
    });
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
    console.log("[Password Reset] Deleting session cookie");
    event.cookies.set(PASSWORD_RESET_COOKIE_NAME, "", {
        maxAge: 0,
        sameSite: "lax",
        httpOnly: true,
        path: "/", // Ensure the cookie is deleted from all paths
        secure: !import.meta.env.DEV
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

export interface PasswordResetSession {
    id: string;
    userId: string;
    email: string;
    expiresAt: Date;
    code: string;
    emailVerified: boolean;
    twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
    | { session: PasswordResetSession; user: User }
    | { session: null; user: null };