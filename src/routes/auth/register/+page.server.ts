import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { registerSchema } from '$lib/schemas/auth';
import { randomUUID } from 'crypto';
import { userRepository } from "$lib/repositories/user-repository";
import { hashPassword } from '$lib/server/auth/password';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth/session';
import {
    createEmailVerificationRequest,
    sendVerificationEmail,
    setEmailVerificationRequestCookie
} from "$lib/server/auth/email-verification";

import type { Actions, PageServerLoad } from "./$types";
import { Provider } from '$lib/models/user';

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
        if (await userRepository.isEmailTaken(email)) {
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
            const user = await userRepository.createUser({
                id: id,
                provider: Provider.EMAIL, // Use the Provider enum from Prisma
                providerId: id,
                email: email,
                image: null,
                firstName: firstName,
                lastName: lastName,
                passwordHash: await hashPassword(password),
                emailVerified: false,
                isAdmin: false,
                status: 'active',
            });

            const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
            sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
            setEmailVerificationRequestCookie(event, emailVerificationRequest);

            const sessionToken = generateSessionToken();
            const session = await createSession(sessionToken, user.id);
            setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
        } catch (error) {
            // At this point, we know it's a real error
            // The redirect is returned from the function, not thrown, so it won't be caught here

            // Log the actual error for debugging
            console.error('Registration error:', error);

            // We're using the original form to avoid reading the request body again
            // But we should clear the password for security in the logs
            console.log('Form data (without password):', { ...form.data, password: '[REDACTED]' });

            // Return a user-friendly error message
            return message(
                form, // Use the original form to avoid reading the request body again
                'An error occurred during registration. Please try again.',
                { status: 500 }
            );
        }
        return redirect(302, "/auth/verify-email");
    }
};