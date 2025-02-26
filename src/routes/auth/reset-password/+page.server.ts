import {
    deletePasswordResetSessionTokenCookie,
    invalidateUserPasswordResetSessions,
    validatePasswordResetSessionRequest
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

import type { Actions, RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
    console.log("[Reset Password] Loading reset password page");
    const { session } = await validatePasswordResetSessionRequest(event);
    if (session === null) {
        console.log("[Reset Password] No valid session found, redirecting to forgot password");
        return redirect(302, "/auth/forgot-password");
    }
    if (!session.emailVerified) {
        console.log("[Reset Password] Email not verified, redirecting to verify email");
        return redirect(302, "/auth/reset-password/verify-email");
    }
    console.log("[Reset Password] Showing password reset form");
    return {};
}

export const actions: Actions = {
    default: action
};

async function action(event: RequestEvent) {
    console.log("[Reset Password] Processing password reset");
    const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest(event);
    if (passwordResetSession === null) {
        console.log("[Reset Password] No valid session");
        return fail(401, {
            message: "Not authenticated"
        });
    }
    if (!passwordResetSession.emailVerified) {
        console.log("[Reset Password] Email not verified");
        return fail(403, {
            message: "Forbidden"
        });
    }

    const formData = await event.request.formData();
    const password = formData.get("password");
    if (typeof password !== "string") {
        return fail(400, {
            message: "Invalid or missing fields"
        });
    }

    const strongPassword = await verifyPasswordStrength(password);
    if (!strongPassword) {
        return fail(400, {
            message: "Weak password"
        });
    }
    invalidateUserPasswordResetSessions(passwordResetSession.userId);
    invalidateUserSessions(passwordResetSession.userId);
    await updateUserPassword(passwordResetSession.userId, password);

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    deletePasswordResetSessionTokenCookie(event);
    console.log("[Reset Password] Password updated successfully, redirecting to home");
    return redirect(302, "/");
}