import { getUserByEmail } from "$lib/server/auth/user";
import {
    createPasswordResetSession,
    invalidateUserPasswordResetSessions,
    sendPasswordResetEmail,
    setPasswordResetSessionTokenCookie,
    PASSWORD_RESET_COOKIE_NAME
} from "$lib/server/auth/password-reset"
import { generateSessionToken } from "$lib/server/auth/session";
import { fail, redirect } from "@sveltejs/kit";
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { passwordResetSchema } from '$lib/schemas/auth';

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
    // Create the form with Superform
    const form = await superValidate(zod(passwordResetSchema));

    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        console.log("[Forgot Password] Starting password reset flow");

        // Validate the form with Superform and Zod
        const form = await superValidate(event.request, zod(passwordResetSchema));

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, { form });
        }

        const { email } = form.data;

        const user = await getUserByEmail(email);
        if (!user) {
            console.log("[Forgot Password] User not found:", email);
            return message(form, "Account not found", { status: 400 });
        }

        let sessionToken;
        let session;

        try {
            console.log("[Forgot Password] Creating reset session for user:", user.id);
            await invalidateUserPasswordResetSessions(user.id);
            sessionToken = generateSessionToken();
            session = await createPasswordResetSession(sessionToken, user.id, user.email);

            console.log("[Forgot Password] Reset session created:", session.id);

            // Send the password reset email
            await sendPasswordResetEmail(session.email, session.code);

            // Set the cookie with the proper path
            setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);

            // Debug cookie
            const cookieValue = event.cookies.get(PASSWORD_RESET_COOKIE_NAME);
            console.log("[Forgot Password] Cookie set:", !!cookieValue);
        } catch (error) {
            console.error("[Forgot Password] Error in reset flow:", error);
            return message(form, "An error occurred. Please try again.", { status: 500 });
        }

        // Redirect outside the try/catch block
        console.log("[Forgot Password] Redirecting to verify email");
        redirect(303, "/auth/reset-password/verify-email");
    }
};