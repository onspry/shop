import { error } from '@sveltejs/kit';
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
        if (user && order.shippingAddress.email !== user.email) {
            // For security, we could verify ownership here
            // For now, we'll just log it but still return the order
            console.warn(`User ${user.email} accessing order for ${order.shippingAddress.email}`);
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
