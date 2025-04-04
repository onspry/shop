import { fail, redirect } from '@sveltejs/kit';
import { cartRepository } from '$lib/server/repositories/cart';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { userRepo } from '$lib/server/repositories/user';
import type { Actions, PageServerLoad } from './$types';
import { emailSchema, shippingSchema } from '$lib/schemas/auth';

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

        // Create forms for non-authenticated users
        const emailForm = await superValidate(zod(emailSchema));
        const shippingForm = await superValidate(zod(shippingSchema));

        return {
            cart: cartData,
            emailForm,
            shippingForm
        };
    } catch (error) {
        console.error('Error loading checkout data:', error);
        throw redirect(303, '/cart?error=checkout');
    }
};

export const actions: Actions = {
    // Check email action
    checkEmail: async ({ request, cookies, locals }) => {
        const form = await superValidate(request, zod(emailSchema));

        if (!form.valid) {
            return fail(400, { emailForm: form });
        }

        try {
            // Check if email is already registered
            const existingUser = await userRepo.getByEmail(form.data.email);
            if (existingUser) {
                form.message = 'This email is already registered. Please sign in instead.';
                return fail(400, { emailForm: form });
            }

            // Create a guest session
            const sessionId = cookies.get('cart-session') || '';
            await cartRepository.setemail(sessionId, form.data.email, locals.user?.id);

            return { emailForm: form };
        } catch (error) {
            console.error('Error checking email:', error);
            form.message = 'An error occurred while checking the email';
            return fail(500, { emailForm: form });
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