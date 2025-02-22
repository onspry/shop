import { encodeBase32 } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from '$lib/server/db';
import { emailVerificationRequest } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getVerificationRequest(id: string, userId: string) {
    return await db
        .select()
        .from(emailVerificationRequest)
        .where(
            and(
                eq(emailVerificationRequest.id, id),
                eq(emailVerificationRequest.userId, userId)
            )
        )
        .get();
}

export async function createVerificationRequest(data: {
    id: string;
    userId: string;
    email: string;
    code: string;
    expiresAt: Date;
}) {
    return await db.insert(emailVerificationRequest).values(data).run();
}

export async function deleteVerificationRequest(id: string) {
    return await db
        .delete(emailVerificationRequest)
        .where(eq(emailVerificationRequest.id, id))
        .run();
}

export async function createEmailVerificationRequest(userId: string, email: string): Promise<EmailVerificationRequest> {
    deleteUserEmailVerificationRequest(userId);
    const idBytes = new Uint8Array(20);
    crypto.getRandomValues(idBytes);
    const id = encodeBase32(idBytes).toLowerCase();

    const code = generateRandomOTP();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    await db.insert(emailVerificationRequest)
        .values({
            id,
            userId,
            code,
            email,
            expiresAt
        })
        .returning({ id: emailVerificationRequest.id })
        .get();

    const request: EmailVerificationRequest = {
        id,
        userId,
        code,
        email,
        expiresAt
    };
    return request;
}

export async function deleteUserEmailVerificationRequest(userId: string): Promise<void> {
    await db
        .delete(emailVerificationRequest)
        .where(eq(emailVerificationRequest.userId, userId))
        .run();
}

export function sendVerificationEmail(email: string, code: string): void {
    console.log(`To ${email}: Your verification code is ${code}`);
}

export function setEmailVerificationRequestCookie(event: RequestEvent, request: EmailVerificationRequest): void {
    event.cookies.set("email_verification", request.id, {
        httpOnly: true,
        path: "/",
        secure: import.meta.env.PROD,
        sameSite: "lax",
        expires: request.expiresAt
    });
}

export function deleteEmailVerificationRequestCookie(event: RequestEvent): void {
    event.cookies.set("email_verification", "", {
        httpOnly: true,
        path: "/",
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 0
    });
}

export async function getUserEmailVerificationRequestFromRequest(event: RequestEvent): Promise<EmailVerificationRequest | null> {
    if (event.locals.user === null) {
        return null;
    }
    const id = event.cookies.get("email_verification") ?? null;
    if (id === null) {
        return null;
    }
    const request = await getVerificationRequest(event.locals.user.id, id);
    if (!request) {
        deleteEmailVerificationRequestCookie(event);
        return null;
    }
    return request;
}

export interface EmailVerificationRequest {
    id: string;
    userId: string;
    code: string;
    email: string;
    expiresAt: Date;
}