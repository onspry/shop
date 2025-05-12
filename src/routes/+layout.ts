import type { LayoutLoad } from './$types';
import { cart } from '$lib/stores/cart';
import { setLocale } from '$lib/paraglide/runtime';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ data }) => {
    // Reset cart store with data from the server
    cart.set(data.cart);

    // Set the locale from server data
    if (browser && data.paraglide?.lang) {
        try {
            setLocale(data.paraglide.lang);
        } catch (error) {
            console.error('Error setting locale:', error);
        }
    }

    return {
        ...data
    };
};

// Disable prerendering globally because we have form actions on multiple pages
export const prerender = false; 