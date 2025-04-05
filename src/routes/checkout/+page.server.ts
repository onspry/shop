import { redirect } from '@sveltejs/kit';
import { cartRepository } from '$lib/server/repositories/cart';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { emailSchema } from '$lib/schemas/auth';
import { shippingSchema } from '$lib/schemas/shipping';
import { paymentSchema } from '$lib/schemas/payment';

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
        const paymentForm = await superValidate(zod(paymentSchema));

        return {
            cart: cartData,
            emailForm,
            shippingForm,
            paymentForm
        };
    } catch (error) {
        console.error('Error loading checkout data:', error);
        throw redirect(303, '/cart?error=checkout');
    }
};
