import { fail, redirect } from '@sveltejs/kit';
import * as cartRepository from '$lib/server/db/repositories/cart';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/auth';
import { shippingSchema } from '$lib/schemas/shipping';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    // Get session or user ID
    const sessionId = cookies.get('sessionId') || '';
    const userId = locals.user?.id;

    if (!sessionId && !userId) {
        // No session or user, redirect to cart
        throw redirect(303, '/cart');
    }

    try {
        // Get cart data using repository pattern
        const cartData = await cartRepository.getCartViewModel(sessionId, userId);

        // If cart is empty, redirect to cart
        if (!cartData.items.length) {
            throw redirect(303, '/cart');
        }

        // Create login form for non-authenticated users
        const loginForm = await superValidate(zod(loginSchema));
        const shippingForm = await superValidate(zod(shippingSchema));

        return {
            cart: cartData,
            form: loginForm,
            shippingForm
        };
    } catch (error) {
        console.error('Error loading checkout data:', error);
        throw redirect(303, '/cart?error=checkout');
    }
};

export const actions: Actions = {
    // Login action for checkout page
    login: async ({ request, cookies, locals, fetch }) => {
        const form = await superValidate(request, zod(loginSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Use a direct fetch to the login endpoint instead of relying on locals.auth
            const loginResponse = await fetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: form.data.email,
                    password: form.data.password
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!loginResponse.ok) {
                form.message = 'Invalid credentials';
                return fail(400, { form });
            }

            // Transfer cart from session to user if needed
            const sessionId = cookies.get('sessionId');
            const userId = locals.user?.id;

            if (sessionId && userId) {
                await cartRepository.transferCartToUser(sessionId, userId);
            }

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            form.message = 'Login failed';
            return fail(500, { form });
        }
    },

    // Process guest checkout without database migration
    guestCheckout: async ({ request, cookies }) => {
        const formData = await request.formData();
        const email = formData.get('email')?.toString();

        if (!email) {
            return fail(400, { message: 'Email is required for guest checkout' });
        }

        try {
            const sessionId = cookies.get('sessionId');
            if (!sessionId) {
                return fail(400, { message: 'No session found' });
            }

            // Store guest email in a separate cookie
            const cookieOptions = {
                path: '/',
                httpOnly: true,
                sameSite: 'strict' as const,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            };

            cookies.set('guestEmail', email, cookieOptions);

            // Redirect directly to shipping
            throw redirect(303, '/checkout/shipping');
        } catch (error) {
            console.error('Guest checkout failed:', error);
            return fail(500, { message: 'Failed to process guest checkout' });
        }
    },

    shipping: async ({ request }) => {
        const form = await superValidate(request, zod(shippingSchema));

        if (!form.valid) {
            return fail(400, { shippingForm: form });
        }

        return {
            shippingForm: form
        };
    }
}; 