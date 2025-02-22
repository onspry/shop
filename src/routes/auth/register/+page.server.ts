import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { createUser, verifyUsernameInput } from '$lib/server/auth/user';
import { verifyPasswordStrength } from '$lib/server/auth/password';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth/session';
import {
    createEmailVerificationRequest,
    sendVerificationEmail,
    setEmailVerificationRequestCookie
} from "$lib/server/auth/email-verification";

import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";


export function load(event: PageServerLoadEvent) {
    if (event.locals.session !== null && event.locals.user !== null) {
        if (!event.locals.user.emailVerified) {
            return redirect(302, "/verify-email");
        }
        if (!event.locals.user.registered2FA) {
            return redirect(302, "/2fa/setup");
        }
        if (!event.locals.session.twoFactorVerified) {
            return redirect(302, "/2fa");
        }
        return redirect(302, "/");
    }
    return {};
}

export const actions: Actions = {
    default: action
};

async function action(event: RequestEvent) {
    const formData = await event.request.formData();
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") {
        return fail(400, {
            message: "Invalid or missing fields",
            email: "",
            username: ""
        });
    }
    if (email === "" || password === "" || username === "") {
        return fail(400, {
            message: "Please enter your username, email, and password",
            email: "",
            username: ""
        });
    }
    if (!verifyEmailInput(email)) {
        return fail(400, {
            message: "Invalid email",
            email,
            username
        });
    }
    const emailAvailable = checkEmailAvailability(email);
    if (!emailAvailable) {
        return fail(400, {
            message: "Email is already used",
            email,
            username
        });
    }
    if (!verifyUsernameInput(username)) {
        return fail(400, {
            message: "Invalid username",
            email,
            username
        });
    }
    const strongPassword = await verifyPasswordStrength(password);
    if (!strongPassword) {
        return fail(400, {
            message: "Weak password",
            email,
            username
        });
    }

    const id = randomUUID();
    const user = await createUser(
        {
            id: id,
            provider: 'email',
            providerId: id,
            email: email,
            username: username,
            passwordHash: '',  // Empty for OAuth users
            email_verified: 1,
            isAdmin: false,
            stripeCustomerId: `e_${id}` // Prefix with gh_ for GitHub users
        }
    );
    const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
    sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
    setEmailVerificationRequestCookie(event, emailVerificationRequest);

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    throw redirect(302, "/");
}

function randomUUID(): string {
    throw new Error('Function not implemented.');
}
