import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { checkEmailAvailability, verifyEmailInput } from '$lib/server/auth/email';
import { createUser, isEmailTaken } from '$lib/server/auth/user';
import { verifyPasswordStrength, hashPassword } from '$lib/server/auth/password';
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
            return redirect(302, "/auth/verify-email");
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
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof firstName !== "string" ||
        typeof lastName !== "string" || typeof password !== "string") {
        return fail(400, {
            message: "Invalid or missing fields",
            email: email || "",
            firstName: firstName || "",
            lastName: lastName || ""
        });
    }
    if (email === "" || password === "" || firstName === "" || lastName === "") {
        return fail(400, {
            message: "Please fill in all fields",
            email: "",
            firstName: "",
            lastName: ""
        });
    }
    if (!verifyEmailInput(email)) {
        return fail(400, {
            message: "Invalid email",
            email,
            firstName,
            lastName
        });
    }
    const emailAvailable = checkEmailAvailability(email);
    if (!emailAvailable) {
        return fail(400, {
            message: "Email is already used",
            email,
            firstName,
            lastName
        });
    }
    const strongPassword = await verifyPasswordStrength(password);
    if (!strongPassword) {
        return fail(400, {
            message: "Weak password",
            email,
            firstName,
            lastName
        });
    }

    // Check if email is already taken
    if (await isEmailTaken(email)) {
        return fail(400, {
            message: 'This email is already registered',
            firstName,
            lastName,
            email
        });
    }

    const id = randomUUID();
    const user = await createUser({
        id: id,
        provider: 'email',
        providerId: id,
        email: email,
        image: null,
        firstname: firstName,
        lastname: lastName,
        passwordHash: await hashPassword(password),
        email_verified: true,
        isAdmin: false,
        stripeCustomerId: `e_${id}`
    });

    const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
    sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
    setEmailVerificationRequestCookie(event, emailVerificationRequest);

    const sessionToken = await generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    throw redirect(302, "/auth/verify-email");
}