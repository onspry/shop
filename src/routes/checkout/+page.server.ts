import { redirect } from '@sveltejs/kit';
import { cartRepository } from '$lib/server/repositories/cart';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { emailSchema } from '$lib/schemas/auth';
import { shippingSchema } from '$lib/schemas/shipping';
import { paymentSchema } from '$lib/schemas/payment';
import { OrderRepository } from '$lib/server/repositories/order';

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

export const actions = {
    placeOrder: async ({ request, locals }) => {
        const formData = await request.formData();
        const cartId = formData.get('cartId')?.toString();
        const email = formData.get('email')?.toString();
        const shippingData = JSON.parse(formData.get('shippingData')?.toString() || '{}');
        const paymentData = JSON.parse(formData.get('paymentData')?.toString() || '{}');

        if (!cartId || !email || !shippingData || !paymentData) {
            return { success: false, error: 'Missing required data' };
        }

        try {
            // Get cart data
            const cart = await cartRepository.getCartViewModel(cartId, locals.user?.id);
            if (!cart || !cart.items.length) {
                return { success: false, error: 'Cart is empty' };
            }

            // Create order data
            const orderData = {
                userId: locals.user?.id,
                cartId,
                items: cart.items.map(item => ({
                    productId: item.variant.id,
                    variantId: item.productVariantId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    name: item.name,
                    variantName: item.variant.name
                })),
                shipping: {
                    method: 'standard',
                    amount: 0, // Free shipping for now
                    address: {
                        firstName: shippingData.firstName,
                        lastName: shippingData.lastName,
                        address1: shippingData.address1,
                        address2: shippingData.address2,
                        city: shippingData.city,
                        state: shippingData.state,
                        postalCode: shippingData.postalCode,
                        country: shippingData.country,
                        phone: shippingData.phone,
                        email: email
                    }
                },
                payment: {
                    method: paymentData.method || 'card',
                    intentId: paymentData.intentId
                },
                subtotal: cart.subtotal,
                taxAmount: 0, // Tax calculation will be implemented later
                discountAmount: cart.discountAmount,
                currency: 'USD'
            };

            // Create order
            const orderRepository = new OrderRepository();
            const order = await orderRepository.createOrder(orderData);

            // Clear cart after successful order creation
            await cartRepository.clearCart(cartId);

            // Return order ID for redirection
            return {
                success: true,
                orderId: order.id
            };
        } catch (error) {
            console.error('Error creating order:', error);
            return {
                success: false,
                error: 'Failed to create order'
            };
        }
    }
};
