import { redirect, fail } from "@sveltejs/kit";
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/auth';
import type { PageServerLoad, Actions } from "./$types";
import { getUserByEmail, getUserPasswordHash } from "$lib/server/auth/user";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/auth/session";

export const load: PageServerLoad = async ({ locals, url }) => {
    if (locals.session !== null && locals.user !== null) {
        // Check if a redirect parameter is provided
        const redirectTo = url.searchParams.get('redirect');
        if (redirectTo && redirectTo.startsWith('/')) {
            throw redirect(302, redirectTo);
        }
        throw redirect(302, "/");
    }

    // Create the form with Superform
    const form = await superValidate(zod(loginSchema));

    return {
        form,
        redirectTo: url.searchParams.get('redirect') || '/'
    };
};

export const actions: Actions = {
    email: async (event) => {
        const { request, url } = event;

        // Validate the form with Superform and Zod
        const form = await superValidate(request, zod(loginSchema));

        // Get redirectTo from URL query params first, then from form data
        const redirectTo = url.searchParams.get('redirect') || form.data.redirectTo || '/';

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, { form, redirectTo });
        }

        const { email, password } = form.data;

        const user = await getUserByEmail(email);
        if (!user) {
            const errorForm = await superValidate(
                { ...form.data, password: '' }, // Clear password for security
                zod(loginSchema)
            );

            return message(
                errorForm,
                'Invalid email or password',
                { status: 400 }
            );
        }

        const passwordHash = await getUserPasswordHash(user.id);
        if (!passwordHash) {
            const errorForm = await superValidate(
                { ...form.data, password: '' }, // Clear password for security
                zod(loginSchema)
            );

            return message(
                errorForm,
                'Invalid email or password',
                { status: 400 }
            );
        }

        const validPassword = await verifyPasswordHash(passwordHash, password);
        if (!validPassword) {
            const errorForm = await superValidate(
                { ...form.data, password: '' }, // Clear password for security
                zod(loginSchema)
            );

            return message(
                errorForm,
                'Invalid email or password',
                { status: 400 }
            );
        }

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id);
        setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // Use the redirectTo from form data first, fallback to URL query param
        if (redirectTo && redirectTo.startsWith('/')) {
            throw redirect(303, redirectTo);
        }

        throw redirect(303, "/");
    }
};