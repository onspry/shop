import { invalidateAll } from '$app/navigation';
import { writable } from 'svelte/store';
import type {
    CartViewModel,
    AddToCartPayload,
    UpdateCartItemPayload,
    RemoveCartItemPayload,
    ApplyDiscountPayload
} from '$lib/types/cart';

// Define page data interface that maps to our cart data
interface CartPageData {
    cart: {
        id: string;
        discountCode: string | null;
    } | null;
    items: Array<{
        id: string;
        productVariantId: string;
        quantity: number;
        price: number;
        variant: {
            id: string;
            name: string;
            price: number;
            stock_quantity: number;
            attributes: Record<string, unknown>;
            productId: string;
            sku: string;
            stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
        };
        product: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
        } | null;
    }>;
    subtotal: number;
    discountAmount: number;
    total: number;
    error?: string;
}

// Initial empty cart state
const initialCart: CartViewModel = {
    id: '',
    items: [],
    discountCode: null,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    itemCount: 0
};

// Create cart store with Svelte writable store
const cartStore = writable<CartViewModel>(initialCart);
const loadingStore = writable<boolean>(false);

// Export stores
export const cart = cartStore;
export const isLoading = loadingStore;

// Helper function to create and submit form data
async function submitFormAction<T>(
    action: string,
    data: T
): Promise<boolean> {
    loadingStore.set(true);

    try {
        // Create form data from object
        const formData = new FormData();
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        // Submit the form using fetch API with the proper cart URL
        // This ensures actions go to the /cart route which has the handlers
        const response = await fetch(`/cart?/${action}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const result = await response.json();
            console.error(`Error in ${action}:`, result);
            return false;
        }

        // Use invalidateAll to refresh all route data
        await invalidateAll();

        return true;
    } catch (error) {
        console.error(`Error in ${action}:`, error);
        return false;
    } finally {
        loadingStore.set(false);
    }
}

// Cart operations
async function addToCart(payload: AddToCartPayload): Promise<boolean> {
    return submitFormAction('addItem', payload);
}

async function updateCartItem(payload: UpdateCartItemPayload): Promise<boolean> {
    return submitFormAction('updateItem', payload);
}

async function removeCartItem(payload: RemoveCartItemPayload): Promise<boolean> {
    return submitFormAction('removeItem', payload);
}

async function applyDiscount(payload: ApplyDiscountPayload): Promise<boolean> {
    // Fix the payload key to match what the server expects
    const correctedPayload = { discountCode: payload.code };
    return submitFormAction('applyDiscount', correctedPayload);
}

async function removeDiscount(): Promise<boolean> {
    return submitFormAction('removeDiscount', {});
}

// Update cart from page data
function updateCartFromPageData(pageData: CartPageData): void {
    if (!pageData) {
        console.warn('No page data provided to updateCartFromPageData');
        return;
    }

    try {
        // Safely get the items array
        const items = Array.isArray(pageData.items) ? pageData.items : [];

        // Map the page data to our CartViewModel structure with safety checks
        const updatedCart: CartViewModel = {
            id: pageData.cart?.id || '',
            items: items.filter(item => item && item.variant).map(item => ({
                id: item.id,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                price: item.price,
                variant: {
                    id: item.variant.id,
                    sku: item.variant.sku,
                    name: item.variant.name,
                    price: item.variant.price,
                    stock_quantity: item.variant.stock_quantity,
                    attributes: item.variant.attributes || {},
                    productId: item.variant.productId,
                    stockStatus: item.variant.stockStatus
                }
            })),
            discountCode: pageData.cart?.discountCode || null,
            discountAmount: pageData.discountAmount || 0,
            subtotal: pageData.subtotal || 0,
            total: pageData.total || 0,
            itemCount: items.reduce(
                (count: number, item) => count + (item?.quantity || 0),
                0
            )
        };

        console.log('Updating cart store with:', updatedCart);
        cartStore.set(updatedCart);
    } catch (error) {
        console.error('Error updating cart from page data:', error);
        // Don't set the store to an invalid state, keep the previous state
    }
}

// Export actions and update function
export { updateCartFromPageData };
export const cartActions = {
    addToCart,
    updateCartItem,
    removeCartItem,
    applyDiscount,
    removeDiscount
}; 