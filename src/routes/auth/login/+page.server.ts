import { redirect, fail } from "@sveltejs/kit";
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/auth';
import type { PageServerLoad, Actions } from "./$types";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/auth/session";
import { userRepository } from "$lib/repositories/user-repository";
import { cartRepository } from "$lib/repositories/cart-repository";

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
    default: async ({ request, cookies, url }) => {
        // Get the cart session before any authentication changes
        const cartSessionId = cookies.get('cart-session') || '';

        // Validate the form with Superform and Zod
        const form = await superValidate(request, zod(loginSchema));

        // Get redirectTo from URL param or default to home
        const redirectTo = url.searchParams.get('redirect') || '/';

        // Return validation errors if any
        if (!form.valid) {
            return fail(400, { form, redirectTo });
        }

        const { email, password } = form.data;

        const user = await userRepository.getUserByEmail(email);
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

        const passwordHash = await userRepository.getPasswordHash(user.id);
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

        // Create authentication session
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id);
        setSessionTokenCookie(cookies, sessionToken, session.expiresAt);

        // Associate cart with user (if cart session exists)
        if (cartSessionId) {
            await cartRepository.handleUserLoginMerge(cartSessionId, user.id);

            // IMPORTANT: Ensure the cart session cookie is preserved after login
            cookies.set('cart-session', cartSessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                domain: '' // Explicitly set empty domain for same-origin only
            });
        }

        // After successful login, redirect to the saved URL if it's internal
        if (redirectTo && redirectTo.startsWith('/')) {
            throw redirect(303, redirectTo);
        }

        throw redirect(303, "/");
    }
};