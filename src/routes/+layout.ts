import type { LayoutLoad } from './$types';
import { updateCartFromPageData } from '$lib/stores/cart';

export const load: LayoutLoad = async ({ data }) => {
    // Update cart store with data from the server
    updateCartFromPageData({ cart: data.cart });

    return {
        ...data
    };
}; 