import { fail, redirect } from '@sveltejs/kit';
import { cartRepository } from '$lib/server/repositories/cart';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/auth';
import { shippingSchema } from '$lib/schemas/shipping';
import { userRepo } from '$lib/server/repositories/user';
import { verifyEmailInput } from '$lib/server/auth/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    // Get session or user ID
    const sessionId = cookies.get('cart-session') || '';
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
    login: async ({ request, cookies, locals }) => {
        const form = await superValidate(request, zod(loginSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Transfer cart from session to user if needed
            const sessionId = cookies.get('cart-session');
            const userId = locals.user?.id;

            if (sessionId && userId) {
                await cartRepository.handleUserLoginMerge(sessionId, userId);
            }

            // Redirect to the same page to trigger a new load with the updated session
            return redirect(303, '/checkout');
        } catch (error) {
            console.error('Login failed:', error);
            form.message = 'Login failed';
            return fail(500, { form });
        }
    },

    // Process guest checkout without database migration
    guestCheckout: async ({ request, cookies, locals }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const userId = locals.user?.id;

        if (!email || typeof email !== 'string') {
            return fail(400, {
                message: 'Email is required'
            });
        }

        if (!verifyEmailInput(email)) {
            return fail(400, {
                message: 'Invalid email format'
            });
        }

        // Check if email is already registered
        const existingUser = await userRepo.getByEmail(email);
        if (existingUser) {
            return fail(400, {
                message: 'This email is already registered. Please sign in instead.'
            });
        }

        // Create a guest session
        const sessionId = cookies.get('cart-session') || '';
        await cartRepository.setGuestEmail(sessionId, email, userId);

        // Redirect to shipping step
        return redirect(303, '/checkout?step=shipping');
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