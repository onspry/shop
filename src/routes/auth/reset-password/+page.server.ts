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
import { updateUserPassword } from "$lib/server/auth/user";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    console.log("[Reset Password] Loading reset password page");

    // Debug cookie
    const cookieValue = event.cookies.get(PASSWORD_RESET_COOKIE_NAME);
    console.log("[Reset Password] Password reset cookie exists:", !!cookieValue);

    const { session } = await validatePasswordResetSessionRequest(event);

    if (session === null) {
        console.log("[Reset Password] No valid session found, redirecting to forgot password");
        throw redirect(303, "/auth/forgot-password");
    }

    if (!session.emailVerified) {
        console.log("[Reset Password] Email not verified, redirecting to verify email");
        throw redirect(303, "/auth/reset-password/verify-email");
    }

    console.log("[Reset Password] Showing password reset form for user:", session.userId);
    return {};
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
            return fail(401, {
                message: "Session expired or invalid. Please try again."
            });
        }

        if (!passwordResetSession.emailVerified) {
            console.log("[Reset Password] Email not verified");
            return fail(403, {
                message: "Email verification required before resetting password."
            });
        }

        const formData = await event.request.formData();
        const password = formData.get("password");

        if (typeof password !== "string" || password.trim() === "") {
            return fail(400, {
                message: "Please enter a new password."
            });
        }

        const strongPassword = await verifyPasswordStrength(password);
        if (!strongPassword) {
            return fail(400, {
                message: "Password is too weak. Please use a stronger password."
            });
        }

        try {
            // Invalidate all sessions
            await invalidateUserPasswordResetSessions(passwordResetSession.userId);
            await invalidateUserSessions(passwordResetSession.userId);

            // Update password
            await updateUserPassword(passwordResetSession.userId, password);

            // Create new session
            const sessionToken = generateSessionToken();
            const session = await createSession(sessionToken, user.id);

            // Set session cookie and delete reset cookie
            setSessionTokenCookie(event, sessionToken, session.expiresAt);
            deletePasswordResetSessionTokenCookie(event);

            console.log("[Reset Password] Password updated successfully");
        } catch (error) {
            console.error("[Reset Password] Error updating password:", error);
            return fail(500, {
                message: "An error occurred while updating your password. Please try again."
            });
        }

        // Redirect outside try/catch
        console.log("[Reset Password] Redirecting to home");
        throw redirect(303, "/");
    }
};