import { generateUUID } from '$lib/utils/uuid';
import type { RequestEvent } from "@sveltejs/kit";
import { generateRandomOTP } from "./utils";
import { prisma } from '$lib/server/db';
import type { EmailVerificationRequest } from '@prisma/client';
import { sendEmail } from '$lib/server/email/send-email';

export async function getVerificationRequest(id: string, userId: string): Promise<EmailVerificationRequest | null> {
    return await prisma.emailVerificationRequest.findFirst({
        where: {
            id: id,
            userId: userId
        }
    });
}

export async function createVerificationRequest(data: {
    id: string;
    userId: string;
    email: string;
    code: string;
    expiresAt: Date;
}): Promise<EmailVerificationRequest> {
    return await prisma.emailVerificationRequest.create({
        data: data
    });
}

export async function deleteVerificationRequest(id: string): Promise<EmailVerificationRequest> {
    return await prisma.emailVerificationRequest.delete({
        where: {
            id: id
        }
    });
}

export async function createEmailVerificationRequest(userId: string, email: string): Promise<EmailVerificationRequest> {
    if (!email) {
        throw new Error('Email is required for verification request');
    }

    const id = generateUUID();
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
    await prisma.emailVerificationRequest.deleteMany({
        where: {
            userId: userId
        }
    });
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