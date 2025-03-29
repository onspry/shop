import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { RequestEvent } from "@sveltejs/kit";
import { generateRandomOTP } from "./utils";
import { db } from '$lib/server/db';
import { emailVerificationRequest } from '$lib/server/db/schema/email-verification-request';
import { sendEmail } from '$lib/server/email/send-email';

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

export async function createEmailVerificationRequest(userId: string, email: string) {
    if (!email) {
        throw new Error('Email is required for verification request');
    }

    const id = randomUUID();
    const code = generateRandomOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await createVerificationRequest({
        id,
        userId,
        email,
        code,
        expiresAt
    });

    return {
        id,
        userId,
        email,
        code,
        expiresAt
    };
}

export async function deleteUserEmailVerificationRequest(userId: string): Promise<void> {
    await db
        .delete(emailVerificationRequest)
        .where(eq(emailVerificationRequest.userId, userId))
        .run();
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
    const subject = 'Verify your email address';
    const body = `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
    `;

    await sendEmail(email, subject, body, { from: 'noreply' });
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
    console.log('Getting user email verification request from request');
    if (event.locals.user === null) {
        return null;
    }
    console.log('User is authenticated');
    const id = event.cookies.get("email_verification") ?? null;
    if (id === null) {
        return null;
    }
    console.log('ID is not null');
    const request = await getVerificationRequest(id, event.locals.user.id);
    if (!request) {
        console.log('Request is null');
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