import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { registerSchema } from '$lib/schemas/auth';
import { randomUUID } from 'crypto';
import { createUser, isEmailTaken } from '$lib/server/auth/user';
import { hashPassword } from '$lib/server/auth/password';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth/session';
import {
    createEmailVerificationRequest,
    sendVerificationEmail,
    setEmailVerificationRequestCookie
} from "$lib/server/auth/email-verification";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    // Redirect if user is already logged in
    if (locals.session !== null && locals.user !== null) {
        if (!locals.user.emailVerified) {
            return redirect(302, "/auth/verify-email");
        }
        return redirect(302, "/");
    }

    // Create the form with Superform
    const form = await superValidate(zod(registerSchema));

    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const { request } = event;

        // Validate the form with Superform and Zod
        const form = await superValidate(request, zod(registerSchema));

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, { form });
        }

        const { firstName, lastName, email, password } = form.data;

        // Check if email is already taken
        if (await isEmailTaken(email)) {
            const errorForm = await superValidate(
                { ...form.data, password: '' }, // Clear password for security
                zod(registerSchema)
            );

            return message(
                errorForm,
                { email: 'This email is already registered' },
                { status: 400 }
            );
        }

        try {
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
                email_verified: false,
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
        } catch (error) {
            console.error('Registration error:', error);

            const errorForm = await superValidate(
                { ...form.data, password: '' }, // Clear password for security
                zod(registerSchema)
            );

            return message(
                errorForm,
                'An error occurred during registration. Please try again.',
                { status: 500 }
            );
        }
    }
};