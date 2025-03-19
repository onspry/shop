import type { Product, ProductVariant, ProductImage } from '$lib/server/db';
import { writable, derived } from 'svelte/store';

// Create writable store with persistent tracking
const store = writable({
    products: [] as Product[],
    variants: [] as ProductVariant[],
    images: [] as ProductImage[],
    loadedKeyboards: new Set<string>(), // Track which keyboards we've loaded accessories for
    selectedProduct: null as Product | null,
    loading: false,
    error: null as string | null
});

// Derived stores for access to individual parts of the store
export const products = derived(store, $store => $store.products);
export const variants = derived(store, $store => $store.variants);
export const images = derived(store, $store => $store.images);
export const selectedProduct = derived(store, $store => $store.selectedProduct);
export const loading = derived(store, $store => $store.loading);
export const error = derived(store, $store => $store.error);

// Derived stores for product categories
export const keyboardProduct = derived(products, $products =>
    $products.find(p => !p.isAccessory && p.category?.toUpperCase() === 'KEYBOARD')
);

export const switchesProduct = derived(products, $products =>
    $products.find(p => p.category?.toUpperCase() === 'SWITCHES')
);

export const keycapsProduct = derived(products, $products =>
    $products.find(p => p.category?.toUpperCase() === 'KEYCAPS')
);

export const accessories = derived(products, $products =>
    $products.filter(p => p.isAccessory)
);

export const accessoryCategories = derived(accessories, $accessories => {
    const groups = new Map<string, Product[]>();
    $accessories.forEach((product) => {
        const category = product.category;
        if (!groups.has(category)) {
            groups.set(category, []);
        }
        groups.get(category)?.push(product);
    });
    return [...groups.entries()] as [string, Product[]][];
});

// Setter functions
export function setProducts(newProducts: Product[]) {
    store.update(state => ({
        ...state,
        products: newProducts
    }));
}

export function setVariants(newVariants: ProductVariant[]) {
    store.update(state => ({
        ...state,
        variants: newVariants
    }));
}

export function setImages(newImages: ProductImage[]) {
    store.update(state => ({
        ...state,
        images: newImages
    }));
}

// Repository-aware actions with persistence
export function loadKeyboardWithAccessories(
    keyboard: Product,
    keyboardVariants: ProductVariant[],
    keyboardImages: ProductImage[],
    accessories: Product[],
    accessoryVariants: ProductVariant[],
    accessoryImages: ProductImage[]
) {
    store.update(state => {
        // If we've already loaded this keyboard and its accessories, don't reload
        if (state.loadedKeyboards.has(keyboard.id)) {
            return state;
        }

        // Add products without duplicates
        const allProducts = [keyboard, ...accessories];
        const existingIds = new Set(state.products.map(p => p.id));
        const newProducts = allProducts.filter(p => !existingIds.has(p.id));

        // Add variants without duplicates
        const allVariants = [...keyboardVariants, ...accessoryVariants];
        const existingVariantIds = new Set(state.variants.map(v => v.id));
        const newVariants = allVariants.filter(v => !existingVariantIds.has(v.id));

        // Add images without duplicates
        const allImages = [...keyboardImages, ...accessoryImages];
        const existingImageIds = new Set(state.images.map(i => i.id));
        const newImages = allImages.filter(i => !existingImageIds.has(i.id));

        // Mark this keyboard as loaded
        const updatedLoadedKeyboards = new Set(state.loadedKeyboards);
        updatedLoadedKeyboards.add(keyboard.id);

        return {
            ...state,
            products: [...state.products, ...newProducts],
            variants: [...state.variants, ...newVariants],
            images: [...state.images, ...newImages],
            loadedKeyboards: updatedLoadedKeyboards
        };
    });
}

export function addProduct(product: Product) {
    store.update(state => {
        // Don't add duplicates
        if (state.products.some(p => p.id === product.id)) {
            return state;
        }
        return {
            ...state,
            products: [...state.products, product]
        };
    });
}

export function addVariants(productVariants: ProductVariant[]) {
    store.update(state => {
        // Filter out duplicates
        const newVariants = productVariants.filter(v =>
            !state.variants.some(existing => existing.id === v.id)
        );
        return {
            ...state,
            variants: [...state.variants, ...newVariants]
        };
    });
}

export function addImages(productImages: ProductImage[]) {
    store.update(state => {
        // Filter out duplicates
        const newImages = productImages.filter(i =>
            !state.images.some(existing => existing.id === i.id)
        );
        return {
            ...state,
            images: [...state.images, ...newImages]
        };
    });
}

// Category-based selectors
export function getProductsByCategory(category: string) {
    let result: Product[] = [];
    products.subscribe($products => {
        result = $products.filter(p => p.category?.toUpperCase() === category.toUpperCase());
    })();
    return result;
}

export function getVariantsByCategory(category: string) {
    let categoryProducts: Product[] = [];
    let result: ProductVariant[] = [];

    products.subscribe($products => {
        categoryProducts = $products.filter(p =>
            p.category?.toUpperCase() === category.toUpperCase()
        );
    })();

    const productIds = categoryProducts.map(p => p.id);

    variants.subscribe($variants => {
        result = $variants.filter(v => productIds.includes(v.productId));
    })();

    return result;
}

export function getImagesByCategory(category: string) {
    let categoryProducts: Product[] = [];
    let result: ProductImage[] = [];

    products.subscribe($products => {
        categoryProducts = $products.filter(p =>
            p.category?.toUpperCase() === category.toUpperCase()
        );
    })();

    const productIds = categoryProducts.map(p => p.id);

    images.subscribe($images => {
        result = $images.filter(i => productIds.includes(i.productId));
    })();

    return result;
}

// Actions
export function fetchProducts() {
    store.update(state => ({
        ...state,
        loading: true,
        error: null
    }));

    try {
        // Just a placeholder - data will come from the page
        return store.update(state => ({
            ...state,
            loading: false
        }));
    } catch (e) {
        return store.update(state => ({
            ...state,
            loading: false,
            error: e instanceof Error ? e.message : 'An error occurred'
        }));
    }
}

export function selectProduct(productId: string) {
    store.update(state => {
        const selected = state.products.find(p => p.id === productId) ?? null;
        return {
            ...state,
            selectedProduct: selected
        };
    });
}

export function getCompatibleAccessories(productId: string) {
    let result: Product[] = [];

    store.subscribe(state => {
        const product = state.products.find(p => p.id === productId);
        if (product) {
            result = state.products.filter(p => p.isAccessory);
        }
    })();

    return result;
}

export function getProductVariants(productId: string) {
    let result: ProductVariant[] = [];

    variants.subscribe($variants => {
        result = $variants.filter(v => v.productId === productId);
    })();

    return result;
}

export function getProductImages(productId: string) {
    let result: ProductImage[] = [];

    images.subscribe($images => {
        result = $images.filter(i => i.productId === productId);
    })();

    return result;
}

// Check if a keyboard has been loaded already
export function isKeyboardLoaded(keyboardId: string) {
    let loaded = false;
    store.subscribe(state => {
        loaded = state.loadedKeyboards.has(keyboardId);
    })();
    return loaded;
} 