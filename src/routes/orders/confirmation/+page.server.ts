import type { PageServerLoad } from './$types';
import { OrderRepository } from '$lib/repositories/order-repository';

export const load: PageServerLoad = async ({ locals }) => {
    // If user is logged in, try to fetch their most recent order
    if (locals.user) {
        try {
            const orderRepo = new OrderRepository();
            const orders = await orderRepo.getOrdersByUserId(locals.user.id, { limit: 1 });
            
            if (orders && orders.length > 0) {
                // Return the most recent order
                return {
                    order: orders[0]
                };
            }
        } catch (err) {
            console.error('Error loading recent order:', err);
            // Continue without an order - the client will handle this
        }
    }
    
    // Return empty data - the client will use the order from the store
    return {};
};
