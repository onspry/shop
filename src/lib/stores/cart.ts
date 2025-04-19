import { writable } from 'svelte/store';
import type { CartViewModel, CartItemViewModel } from '$lib/models/cart';

const CART_STORAGE_KEY = 'cart_data';

function safeJSONParse<T>(jsonString: string | null, fallback: T): T {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Failed to parse stored cart data:', error);
        return fallback;
    }
}

// Initial cart state
const initialCart: CartViewModel = {
    id: '',
    items: [],
    discountCode: null,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    itemCount: 0
};

export const createCartStore = () => {
    const storedData = typeof window !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null;
    const initialState = storedData ? safeJSONParse(storedData, initialCart) : initialCart;
    const { subscribe, set, update } = writable<CartViewModel>(initialState);

    // Remove any setTimeout or artificial delays here
    if (typeof window !== 'undefined') {
        subscribe((state) => {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
        });
    }

    return {
        subscribe,
        set: (cartData: CartViewModel) => {
            // Ensure we have a valid cart object
            const validCart: CartViewModel = {
                id: cartData?.id || '',
                items: cartData?.items || [],
                discountCode: cartData?.discountCode || null,
                discountAmount: cartData?.discountAmount || 0,
                subtotal: cartData?.subtotal || 0,
                total: cartData?.total || 0,
                itemCount: cartData?.itemCount || 0
            };
            set(validCart);
        },
        addItem: (item: CartItemViewModel) => update(cart => {
            // Only add if not already present
            if (cart.items.some(i => i.id === item.id)) return cart;
            const items = [...cart.items, item];
            return { ...cart, items, itemCount: items.length };
        }),
        removeItem: (itemId: string) => update(cart => {
            const items = cart.items.filter(i => i.id !== itemId);
            return { ...cart, items, itemCount: items.length };
        }),
        updateQuantity: (itemId: string, quantity: number) => update(cart => {
            const items = cart.items.map(i => i.id === itemId ? { ...i, quantity } : i);
            return { ...cart, items };
        }),
        clear: () => set(initialCart),
    };
};

export const cart = createCartStore();
