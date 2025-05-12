import type { RequestEvent } from '@sveltejs/kit';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { prisma } from '$lib/server/db';
import type { Session, User } from '@prisma/client';
import type { Cookies } from '@sveltejs/kit';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

/**
 * Generates a cryptographically secure random session token
 * @returns A base64url encoded random token
 */
export function generateSessionToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = encodeBase64url(bytes);
    return token;
}

/**
 * Creates a new session for a user
 * @param token - The session token
 * @param userId - The user ID
 * @returns The created session
 */
export async function createSession(token: string, userId: string): Promise<Session> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const expiresAt = new Date(Date.now() + DAY_IN_MS * 30);

    return await prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt
        }
    });
}

/**
 * Validates a session token
 * @param token - The session token to validate
 * @returns The session and user if valid, null otherwise
 */
export async function validateSessionToken(token: string): Promise<{ session: Session | null; user: User | null }> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

    // Find the session with the user
    const validSession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
    });

    if (!validSession) {
        return { session: null, user: null };
    }

    // Check if session is expired
    const sessionExpired = Date.now() >= validSession.expiresAt.getTime();
    if (sessionExpired) {
        await prisma.session.delete({
            where: { id: validSession.id }
        });
        return { session: null, user: null };
    }

    // Renew session if it's close to expiring
    const renewSession = Date.now() >= validSession.expiresAt.getTime() - DAY_IN_MS * 15;
    if (renewSession) {
        const newExpiresAt = new Date(Date.now() + DAY_IN_MS * 30);
        await prisma.session.update({
            where: { id: validSession.id },
            data: { expiresAt: newExpiresAt }
        });
        validSession.expiresAt = newExpiresAt;
    }

    return {
        session: validSession,
        user: validSession.user
    };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

/**
 * Invalidates a session by ID
 * @param sessionId - The session ID to invalidate
 */
export async function invalidateSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
        where: { id: sessionId }
    });
}

/**
 * Invalidates all sessions for a user
 * @param userId - The user ID
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
        where: { userId: userId }
    });
}

/**
 * Sets the session token cookie
 * @param cookies - The cookies object
 * @param token - The session token
 * @param expiresAt - The expiration date
 * @param response - Optional response object to also set the cookie header
 */
export function setSessionTokenCookie(cookies: Cookies, token: string, expiresAt: Date, response?: Response): void {
    const cookieValue = {
        expires: expiresAt,
        path: '/',
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        domain: ''
    };

    cookies.set(sessionCookieName, token, cookieValue);

    // If a response object is provided, also add the cookie header to the response
    if (response) {
        const cookieStr = `${sessionCookieName}=${token}; Path=${cookieValue.path}; ${cookieValue.httpOnly ? 'HttpOnly;' : ''} SameSite=${cookieValue.sameSite}; ${cookieValue.secure ? 'Secure;' : ''} Expires=${expiresAt.toUTCString()}`;
        response.headers.append('Set-Cookie', cookieStr);
    }
}

/**
 * Deletes the session token cookie
 * @param event - The request event
 */
export function deleteSessionTokenCookie(event: RequestEvent): void {
    console.log('Deleting session cookie');
    event.cookies.delete(sessionCookieName, {
        path: '/'
    });
    console.log('Session cookie deletion complete');
}
