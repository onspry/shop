import { fail, redirect } from "@sveltejs/kit";
import {
    createEmailVerificationRequest,
    deleteEmailVerificationRequestCookie,
    deleteUserEmailVerificationRequest,
    getUserEmailVerificationRequestFromRequest,
    sendVerificationEmail,
    setEmailVerificationRequestCookie
} from "$lib/server/auth/email-verification";
//import { invalidateUserPasswordResetSessions } from "$lib/server/auth/password-reset";
import { updateUserEmailAndSetEmailAsVerified } from "$lib/server/auth/user";
import { rateLimit } from "$lib/server/auth/rate-limit";
import { validateVerificationCode } from "$lib/server/auth/validation";

import type { Actions, RequestEvent } from "./$types";

const MAX_VERIFICATION_ATTEMPTS = 5;

export async function load(event: RequestEvent) {
    if (!event.locals.session || !event.locals.user) {
        redirect(302, "/auth/login");
    }

    if (event.locals.user.emailVerified) {
        redirect(302, "/");
    }

    let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);

    // Add debug logging
    console.log('User:', event.locals.user);
    console.log('Email:', event.locals.user.email);

    // Create new verification request if needed
    if (!verificationRequest || Date.now() >= verificationRequest.expiresAt.getTime()) {
        // Ensure email exists before creating request
        if (!event.locals.user.email) {
            redirect(302, "/auth/register");
        }

        verificationRequest = await createEmailVerificationRequest(
            event.locals.user.id,
            event.locals.user.email
        );
        await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
        setEmailVerificationRequestCookie(event, verificationRequest);
    }

    return {
        email: verificationRequest.email
    };
}

export const actions: Actions = {
    verify: async (event) => {
        // Check authentication
        if (!event.locals.session || !event.locals.user) {
            console.log('User not authenticated'); // Debug log
            return fail(401, { verify: { message: "Not authenticated" } });
        }

        // Get verification request
        const verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
        if (!verificationRequest) {
            console.log('No verification request found'); // Debug log
            return fail(401, { verify: { message: "No verification request found" } });
        }

        // Rate limiting
        const rateLimitResult = await rateLimit(`verify-email:${event.locals.user.id}`, {
            maxAttempts: MAX_VERIFICATION_ATTEMPTS,
            windowMs: 15 * 60 * 1000 // 15 minutes
        });

        if (!rateLimitResult.success) {
            return fail(429, {
                verify: {
                    message: `Too many attempts. Please try again in ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds.`
                }
            });
        }

        // Validate input
        const formData = await event.request.formData();
        const code = formData.get("code");

        console.log('Received code:', code); // Debug log

        if (typeof code !== "string" || !validateVerificationCode(code)) {
            console.log('Invalid verification code format'); // Debug log
            return fail(400, { verify: { message: "Invalid verification code format" } });
        }

        // Check expiration
        if (Date.now() >= verificationRequest.expiresAt.getTime()) {
            const newRequest = await createEmailVerificationRequest(
                verificationRequest.userId,
                verificationRequest.email
            );
            await sendVerificationEmail(newRequest.email, newRequest.code);
            setEmailVerificationRequestCookie(event, newRequest);

            return fail(400, {
                verify: { message: "Code expired. A new code has been sent." }
            });
        }

        // Verify code
        if (verificationRequest.code !== code) {
            return fail(400, { verify: { message: "Incorrect code" } });
        }

        // Success - update user and clean up
        await Promise.all([
            deleteUserEmailVerificationRequest(event.locals.user.id),
            updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email)
        ]);

        deleteEmailVerificationRequestCookie(event);
        redirect(302, "/");
    },

    resend: async (event) => {
        // Check authentication
        if (!event.locals.session || !event.locals.user) {
            return fail(401, { resend: { message: "Not authenticated" } });
        }

        // Rate limiting for resend
        const rateLimitResult = await rateLimit(`resend-email:${event.locals.user.id}`, {
            maxAttempts: 5,
            windowMs: 60 * 60 * 1000 // 1 hour
        });

        if (!rateLimitResult.success) {
            return fail(429, {
                resend: {
                    message: `Please wait ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} seconds before requesting another code.`
                }
            });
        }

        // Create new verification request
        const verificationRequest = await createEmailVerificationRequest(
            event.locals.user.id,
            event.locals.user.email
        );

        await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
        setEmailVerificationRequestCookie(event, verificationRequest);

        return {
            resend: { message: "A new verification code has been sent to your email." }
        };
    }
};