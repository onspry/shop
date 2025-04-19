import type { LayoutLoad } from './$types';
import { cart } from '$lib/stores/cart';

export const load: LayoutLoad = async ({ data }) => {
    // Reset cart store with data from the server
    cart.set(data.cart);

    return {
        ...data
    };
}; 