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

import type { Actions } from "./$types";

export const actions: Actions = {
    default: async (event) => {
        console.log("[Forgot Password] Starting password reset flow");
        const formData = await event.request.formData();
        const email = formData.get("email");

        if (typeof email !== "string") {
            console.log("[Forgot Password] Invalid email format");
            return fail(400, { message: "Invalid email" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            console.log("[Forgot Password] User not found:", email);
            return fail(400, { message: "Account not found" });
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
            return fail(500, { message: "An error occurred. Please try again." });
        }

        // Redirect outside the try/catch block
        console.log("[Forgot Password] Redirecting to verify email");
        throw redirect(303, "/auth/reset-password/verify-email");
    }
};