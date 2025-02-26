import {
    validatePasswordResetSessionRequest,
    setPasswordResetSessionAsEmailVerified
} from "$lib/server/auth/password-reset";
import { fail, redirect } from "@sveltejs/kit";

import type { Actions } from "./$types";

export const load = async (event) => {
    console.log("[Verify Email] Loading verification page");
    const result = await validatePasswordResetSessionRequest(event);
    if (!result.session) {
        console.log("[Verify Email] No valid session found, redirecting to forgot password");
        throw redirect(303, "/auth/forgot-password");
    }
    if (result.session.emailVerified) {
        console.log("[Verify Email] Email already verified, redirecting to reset password");
        throw redirect(303, "/auth/reset-password");
    }
    console.log("[Verify Email] Showing verification form for email:", result.session.email);
    return {
        email: result.session.email
    };
};

export const actions: Actions = {
    default: async (event) => {
        console.log("[Verify Email] Processing verification code");
        const result = await validatePasswordResetSessionRequest(event);
        if (!result.session) {
            console.log("[Verify Email] Session expired");
            return fail(400, { message: "Session expired" });
        }

        const formData = await event.request.formData();
        const code = formData.get("code");

        if (code !== result.session.code) {
            console.log("[Verify Email] Invalid code provided");
            return fail(400, {
                message: "Invalid code",
                email: result.session.email
            });
        }

        console.log("[Verify Email] Code verified, marking session as verified");
        await setPasswordResetSessionAsEmailVerified(result.session.id);
        console.log("[Verify Email] Redirecting to reset password page");
        return redirect(303, "/auth/reset-password");
    }
};