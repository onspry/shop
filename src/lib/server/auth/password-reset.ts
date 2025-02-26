import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";
import { eq } from 'drizzle-orm';

import type { User } from '$lib/server/db/schema';

import type { RequestEvent } from "@sveltejs/kit";

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

    db.insert(table.passwordResetSession).values({
        id: session.id,
        userId: session.userId,
        email: session.email,
        code: session.code,
        expiresAt: session.expiresAt,
        email_verified: session.emailVerified,
    }).run();

    return session;
}

export async function validatePasswordResetSessionToken(token: string): Promise<PasswordResetSessionValidationResult> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const [result] = await db
        .select({
            session: table.passwordResetSession,
            user: table.user
        })
        .from(table.passwordResetSession)
        .innerJoin(table.user, eq(table.passwordResetSession.userId, table.user.id))
        .where(eq(table.passwordResetSession.id, sessionId));

    if (!result) return { session: null, user: null };

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
        username: dbUser.username,
        email_verified: dbUser.email_verified,
        isAdmin: dbUser.isAdmin,
        provider: 'email',
        providerId: dbUser.id,
        passwordHash: '',
        stripeCustomerId: `email_${dbUser.id}`
    };

    if (Date.now() >= session.expiresAt.getTime()) {
        await db.delete(table.passwordResetSession)
            .where(eq(table.passwordResetSession.id, session.id));
        return { session: null, user: null };
    }
    return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string): Promise<void> {
    await db.update(table.passwordResetSession)
        .set({ email_verified: true })
        .where(eq(table.passwordResetSession.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string): Promise<void> {
    await db.update(table.passwordResetSession)
        .set({ twoFactorVerified: true })
        .where(eq(table.passwordResetSession.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: string): Promise<void> {
    await db.delete(table.passwordResetSession)
        .where(eq(table.passwordResetSession.userId, userId));
}

export async function validatePasswordResetSessionRequest(event: RequestEvent): Promise<PasswordResetSessionValidationResult> {
    const token = event.cookies.get("password_reset_session") ?? null;
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
    event.cookies.set("password_reset_session", token, {
        expires: expiresAt,
        sameSite: "lax",
        httpOnly: true,
        path: "/",
        secure: !import.meta.env.DEV
    });
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
    event.cookies.set("password_reset_session", "", {
        maxAge: 0,
        sameSite: "lax",
        httpOnly: true,
        path: "/",
        secure: !import.meta.env.DEV
    });
}

export function sendPasswordResetEmail(email: string, code: string): void {
    console.log(`To ${email}: Your reset code is ${code}`);
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