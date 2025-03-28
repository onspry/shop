import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/user';
import { session } from '$lib/server/db/schema/session';
import type { Session } from '$lib/server/db/schema/session';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const token = encodeBase64url(bytes);
    return token;
}

export async function createSession(token: string, userId: string) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const newSession: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
    };
    await db.insert(session).values(newSession);
    return newSession;
}

export async function validateSessionToken(token: string) {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const [result] = await db
        .select({
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                email_verified: user.emailVerified,
                isAdmin: user.isAdmin,
                image: user.image
            },
            session: session
        })
        .from(session)
        .innerJoin(user, eq(session.userId, user.id))
        .where(eq(session.id, sessionId));

    if (!result) {
        return { session: null, user: null };
    }
    const { session: validSession, user: validUser } = result;

    const sessionExpired = Date.now() >= validSession.expiresAt.getTime();
    if (sessionExpired) {
        await db.delete(session).where(eq(session.id, validSession.id));
        return { session: null, user: null };
    }

    const renewSession = Date.now() >= validSession.expiresAt.getTime() - DAY_IN_MS * 15;
    if (renewSession) {
        validSession.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
        await db
            .update(session)
            .set({ expiresAt: validSession.expiresAt })
            .where(eq(session.id, validSession.id));
    }

    return { session: validSession, user: validUser };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
    await db.delete(session).where(eq(session.id, sessionId));
}

export async function invalidateUserSessions(userId: string) {
    await db.delete(session).where(eq(session.userId, userId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
    event.cookies.set(sessionCookieName, token, {
        expires: expiresAt,
        path: '/'
    });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
    console.log('Deleting session cookie');
    event.cookies.delete(sessionCookieName, {
        path: '/'
    });
    console.log('Session cookie deletion complete');
}
