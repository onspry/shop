import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { OrderRepository } from '$lib/server/repositories/order';

export const load: PageServerLoad = async ({ locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
        throw redirect(303, '/auth/login?redirect=/orders');
    }

    try {
        // Get orders for the current user
        const orderRepo = new OrderRepository();
        const orders = await orderRepo.getOrdersByUserId(locals.user.id);

        return {
            orders
        };
    } catch (error) {
        console.error('Error loading orders:', error);
        return {
            orders: [],
            error: 'Failed to load orders'
        };
    }
}; 