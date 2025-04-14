import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderRepository } from '$lib/repositories/order-repository';

export const load: PageServerLoad = async ({ params, locals }) => {
    const { orderId } = params;
    console.log('Loading order confirmation page for order ID:', orderId);

    try {
        const orderRepo = new OrderRepository();
        console.log('Fetching order with ID:', orderId);
        const order = await orderRepo.getOrderById(orderId);
        console.log('Order found:', order ? 'Yes' : 'No');

        if (!order) {
            throw error(404, {
                message: 'Order not found'
            });
        }

        // Check if user is logged in and if the order belongs to them
        const user = locals.user;

        // If no user is logged in, redirect to the simple confirmation page
        if (!user) {
            throw redirect(303, '/orders/confirmation/simple');
        }

        // If the order doesn't belong to the logged-in user, redirect to orders page
        if (user && order.shippingAddress.email !== user.email) {
            console.warn(`User ${user.email} attempting to access order for ${order.shippingAddress.email}`);
            throw redirect(303, '/orders');
        }

        return {
            order,
            orderId
        };
    } catch (err) {
        console.error('Error loading order:', err);
        throw error(500, {
            message: 'Failed to load order details'
        });
    }
};
