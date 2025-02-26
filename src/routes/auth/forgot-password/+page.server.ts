import { getUserByEmail } from "$lib/server/auth/user";
import {
    createPasswordResetSession,
    invalidateUserPasswordResetSessions,
    sendPasswordResetEmail,
    setPasswordResetSessionTokenCookie
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

        console.log("[Forgot Password] Creating reset session for user:", user.id);
        await invalidateUserPasswordResetSessions(user.id);
        const sessionToken = generateSessionToken();
        const session = await createPasswordResetSession(sessionToken, user.id, user.email);

        console.log("[Forgot Password] Reset session created:", session.id);
        sendPasswordResetEmail(session.email, session.code);
        setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);

        console.log("[Forgot Password] Redirecting to verify email");
        return redirect(303, "/auth/reset-password/verify-email");
    }
};