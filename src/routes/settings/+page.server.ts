import {
    createEmailVerificationRequest,
    sendVerificationEmail,
    setEmailVerificationRequestCookie
} from "$lib/server/auth/email-verification";
import { fail, redirect } from "@sveltejs/kit";
import { checkEmailAvailability, verifyEmailInput } from "$lib/server/auth/email";
import { verifyPasswordHash, verifyPasswordStrength } from "$lib/server/auth/password";
import { userRepo } from "$lib/server/repositories/user";
import {
    createSession,
    generateSessionToken,
    invalidateUserSessions,
    setSessionTokenCookie
} from "$lib/server/auth/session";

import type { Actions, RequestEvent } from "./$types";


export async function load(event: RequestEvent) {
    if (event.locals.session === null || event.locals.user === null) {
        return redirect(302, "/login");
    }

    return {
        user: event.locals.user
    };
}

export const actions: Actions = {
    password: updatePasswordAction,
    email: updateEmailAction
};

async function updatePasswordAction(event: RequestEvent) {
    if (event.locals.session === null || event.locals.user === null) {
        return fail(401, {
            password: {
                message: "Not authenticated"
            }
        });
    }
    if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
        return fail(403, {
            password: {
                message: "Forbidden"
            }
        });
    }

    const formData = await event.request.formData();
    const password = formData.get("password");
    const newPassword = formData.get("new_password");
    if (typeof password !== "string" || typeof newPassword !== "string") {
        return fail(400, {
            password: {
                message: "Invalid or missing fields"
            }
        });
    }
    const strongPassword = await verifyPasswordStrength(newPassword);
    if (!strongPassword) {
        return fail(400, {
            password: {
                message: "Weak password"
            }
        });
    }

    const passwordHash = await userRepo.getPasswordHash(event.locals.user.id);
    if (!passwordHash) {
        return fail(400, {
            password: {
                message: "Invalid password configuration"
            }
        });
    }
    const validPassword = await verifyPasswordHash(passwordHash, password);
    if (!validPassword) {
        return fail(400, {
            password: {
                message: "Incorrect password"
            }
        });
    }
    invalidateUserSessions(event.locals.user.id);
    await userRepo.updatePassword(event.locals.user.id, newPassword);

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, event.locals.user.id);
    setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
    return {
        password: {
            message: "Updated password"
        }
    };
}

async function updateEmailAction(event: RequestEvent) {
    if (event.locals.session === null || event.locals.user === null) {
        return fail(401, {
            email: {
                message: "Not authenticated"
            }
        });
    }


    const formData = await event.request.formData();
    const email = formData.get("email");
    if (typeof email !== "string") {
        return fail(400, {
            email: {
                message: "Invalid or missing fields"
            }
        });
    }
    if (email === "") {
        return fail(400, {
            email: {
                message: "Please enter your email"
            }
        });
    }
    if (!verifyEmailInput(email)) {
        return fail(400, {
            email: {
                message: "Please enter a valid email"
            }
        });
    }
    const emailAvailable = checkEmailAvailability(email);
    if (!emailAvailable) {
        return fail(400, {
            email: {
                message: "This email is already used"
            }
        });
    }

    const verificationRequest = await createEmailVerificationRequest(event.locals.user.id, email);
    await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
    setEmailVerificationRequestCookie(event, verificationRequest);
    return redirect(302, "/auth/verify-email");
}