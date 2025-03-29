import {
    deletePasswordResetSessionTokenCookie,
    invalidateUserPasswordResetSessions,
    validatePasswordResetSessionRequest,
    PASSWORD_RESET_COOKIE_NAME
} from "$lib/server/auth/password-reset";
import { fail, redirect } from "@sveltejs/kit";
import { verifyPasswordStrength } from "$lib/server/auth/password";
import {
    createSession,
    generateSessionToken,
    invalidateUserSessions,
    setSessionTokenCookie
} from "$lib/server/auth/session";
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { passwordUpdateSchema } from '$lib/schemas/auth';
import { userRepo } from "$lib/server/repositories/user";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    console.log("[Reset Password] Loading reset password page");

    // Debug cookie
    const cookieValue = event.cookies.get(PASSWORD_RESET_COOKIE_NAME);
    console.log("[Reset Password] Password reset cookie exists:", !!cookieValue);

    const { session } = await validatePasswordResetSessionRequest(event);

    if (session === null) {
        console.log("[Reset Password] No valid session found, redirecting to forgot password");
        redirect(303, "/auth/forgot-password");
    }

    if (!session.emailVerified) {
        console.log("[Reset Password] Email not verified, redirecting to verify email");
        redirect(303, "/auth/reset-password/verify-email");
    }

    // Create the form with Superform
    const form = await superValidate(zod(passwordUpdateSchema));

    console.log("[Reset Password] Showing password reset form for user:", session.userId);
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        console.log("[Reset Password] Processing password reset");

        // Debug cookie
        const cookieValue = event.cookies.get(PASSWORD_RESET_COOKIE_NAME);
        console.log("[Reset Password] Password reset cookie exists:", !!cookieValue);

        const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(event);

        if (passwordResetSession === null) {
            console.log("[Reset Password] No valid session");
            // Create a form to return with the error message
            const form = await superValidate(zod(passwordUpdateSchema));
            return message(form, "Session expired or invalid. Please try again.", { status: 401 });
        }

        if (!passwordResetSession.emailVerified) {
            console.log("[Reset Password] Email not verified");
            // Create a form to return with the error message
            const form = await superValidate(zod(passwordUpdateSchema));
            return message(form, "Email verification required before resetting password.", { status: 403 });
        }

        // Validate the form with Superform and Zod
        const form = await superValidate(event.request, zod(passwordUpdateSchema));

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, { form });
        }

        const { password } = form.data;

        const strongPassword = await verifyPasswordStrength(password);
        if (!strongPassword) {
            return message(
                form,
                "Password is too weak. Please use a stronger password.",
                { status: 400 }
            );
        }

        try {
            // Invalidate all sessions
            await invalidateUserPasswordResetSessions(passwordResetSession.userId);
            await invalidateUserSessions(passwordResetSession.userId);

            // Update password
            await userRepo.updatePassword(passwordResetSession.userId, password);

            // Create new session
            const sessionToken = generateSessionToken();
            const session = await createSession(sessionToken, user.id);

            // Set session cookie and delete reset cookie
            setSessionTokenCookie(event, sessionToken, session.expiresAt);
            deletePasswordResetSessionTokenCookie(event);

            console.log("[Reset Password] Password updated successfully");
        } catch (error) {
            console.error("[Reset Password] Error updating password:", error);
            return message(
                form,
                "An error occurred while updating your password. Please try again.",
                { status: 500 }
            );
        }

        // Redirect outside try/catch
        console.log("[Reset Password] Redirecting to home");
        redirect(303, "/");
    }
};