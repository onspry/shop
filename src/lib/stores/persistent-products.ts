// lib/stores/persistentProducts.ts
import { writable, derived } from 'svelte/store';
import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';

function createPersistentProductStore() {
    const { subscribe, update } = writable({
        products: [] as Product[],
        variants: [] as ProductVariant[],
        images: [] as ProductImage[],
        loadedKeyboards: new Set<string>(), // Track which keyboards we've loaded accessories for
        loading: false
    });

    return {
        subscribe,

        // Load a keyboard with accessories only if we haven't loaded it before
        loadKeyboardWithAccessories: (
            keyboard: Product,
            variants: ProductVariant[],
            images: ProductImage[],
            accessories: Product[],
            accessoryVariants: ProductVariant[],
            accessoryImages: ProductImage[]
        ) => {
            update(state => {
                // If we've already loaded this keyboard and its accessories, don't reload
                if (state.loadedKeyboards.has(keyboard.id)) {
                    return state;
                }

                // Otherwise, mark as loading
                state.loading = true;

                // Add products without duplicates
                const allProducts = [keyboard, ...accessories];
                const existingIds = new Set(state.products.map(p => p.id));

                const newProducts = allProducts.filter(p => !existingIds.has(p.id));

                // Add variants without duplicates
                const allVariants = [...variants, ...accessoryVariants];
                const existingVariantIds = new Set(state.variants.map(v => v.id));

                const newVariants = allVariants.filter(v => !existingVariantIds.has(v.id));

                // Add images without duplicates
                const allImages = [...images, ...accessoryImages];
                const existingImageIds = new Set(state.images.map(i => i.id));

                const newImages = allImages.filter(i => !existingImageIds.has(i.id));

                // Mark this keyboard as loaded
                state.loadedKeyboards.add(keyboard.id);
                state.loading = false;

                return {
                    ...state,
                    products: [...state.products, ...newProducts],
                    variants: [...state.variants, ...newVariants],
                    images: [...state.images, ...newImages]
                };
            });
        },

        // Other methods...
        isLoading: derived({ subscribe }, $state => $state.loading)
    };
}

export const persistentProductStore = createPersistentProductStore();

// Derived stores
export const keyboardProducts = derived(persistentProductStore, $store =>
    $store.products.filter(p => p.category?.toUpperCase() === 'KEYBOARD')
);

export const switchesProducts = derived(persistentProductStore, $store =>
    $store.products.filter(p => p.category?.toUpperCase() === 'SWITCHES')
);

export const keycapsProducts = derived(persistentProductStore, $store =>
    $store.products.filter(p => p.category?.toUpperCase() === 'KEYCAPS')
);