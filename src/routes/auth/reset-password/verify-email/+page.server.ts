import {
    validatePasswordResetSessionRequest,
    setPasswordResetSessionAsEmailVerified,
    PASSWORD_RESET_COOKIE_NAME
} from "$lib/server/auth/password-reset";
import { fail, redirect } from "@sveltejs/kit";
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { verificationCodeSchema } from '$lib/schemas/auth';

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    console.log("[Verify Email] Loading verification page");

    // Debug cookie
    const cookieValue = event.cookies.get(PASSWORD_RESET_COOKIE_NAME);
    console.log("[Verify Email] Password reset cookie exists:", !!cookieValue);

    const result = await validatePasswordResetSessionRequest(event);

    if (!result.session) {
        console.log("[Verify Email] No valid session found, redirecting to forgot password");
        redirect(303, "/auth/forgot-password");
    }

    if (result.session.emailVerified) {
        console.log("[Verify Email] Email already verified, redirecting to reset password");
        redirect(303, "/auth/reset-password");
    }

    // Create the form with Superform
    const form = await superValidate(zod(verificationCodeSchema));

    console.log("[Verify Email] Showing verification form for email:", result.session.email);
    return {
        email: result.session.email,
        form
    };
};

export const actions: Actions = {
    default: async (event) => {
        console.log("[Verify Email] Processing verification code");
        const result = await validatePasswordResetSessionRequest(event);

        if (!result.session) {
            console.log("[Verify Email] Session expired or not found");
            // Create a form to return with the error message
            const form = await superValidate(zod(verificationCodeSchema));
            return message(form, "Session expired. Please try again.", { status: 400 });
        }

        // Validate the form with Superform and Zod
        const form = await superValidate(event.request, zod(verificationCodeSchema));

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, {
                form,
                email: result.session.email
            });
        }

        const { code } = form.data;

        if (code !== result.session.code) {
            console.log("[Verify Email] Invalid code provided");
            // Set the error directly on the form data
            form.errors.code = ["Invalid verification code"];
            return message(
                form,
                "Invalid code. Please check and try again.",
                { status: 400 }
            );
        }

        console.log("[Verify Email] Code verified, marking session as verified");
        await setPasswordResetSessionAsEmailVerified(result.session.id);
        console.log("[Verify Email] Redirecting to reset password page");
        redirect(303, "/auth/reset-password");
    }
};