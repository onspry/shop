import type { ProductViewModel, ProductVariantViewModel, ProductImageViewModel } from '$lib/models/product';
import { writable, derived } from 'svelte/store';

// Create writable store with persistent tracking
const store = writable({
    products: [] as ProductViewModel[],
    variants: [] as ProductVariantViewModel[],
    images: [] as ProductImageViewModel[],
    loadedKeyboards: new Set<string>(), // Track which keyboards we've loaded accessories for
    selectedProduct: null as ProductViewModel | null,
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

export const keycapsProduct = derived(products, $products =>
    $products.find(p => p.category?.toUpperCase() === 'KEYCAP')
);

export const accessories = derived(products, $products =>
    $products.filter(p => p.isAccessory)
);

export const accessoryCategories = derived(accessories, $accessories => {
    const groups = new Map<string, ProductViewModel[]>();
    $accessories.forEach((product) => {
        const category = product.category;
        if (!groups.has(category)) {
            groups.set(category, []);
        }
        groups.get(category)?.push(product);
    });
    return [...groups.entries()] as [string, ProductViewModel[]][];
});

// Repository-aware actions with persistence
export function loadKeyboardWithAccessories(
    keyboard: ProductViewModel,
    keyboardVariants: ProductVariantViewModel[],
    accessories: ProductViewModel[],
    accessoryVariants: ProductVariantViewModel[]
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

        // Mark this keyboard as loaded
        const updatedLoadedKeyboards = new Set(state.loadedKeyboards);
        updatedLoadedKeyboards.add(keyboard.id);

        return {
            ...state,
            products: [...state.products, ...newProducts],
            variants: [...state.variants, ...newVariants],
            loadedKeyboards: updatedLoadedKeyboards
        };
    });
}

// Setter functions
export function setProducts(newProducts: ProductViewModel[]) {
    store.update(state => ({
        ...state,
        products: newProducts
    }));
}

export function setVariants(newVariants: ProductVariantViewModel[]) {
    store.update(state => ({
        ...state,
        variants: newVariants
    }));
}

export function addProduct(product: ProductViewModel) {
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

export function addVariants(productVariants: ProductVariantViewModel[]) {
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

// Category-based selectors
export function getProductsByCategory(category: string) {
    let result: ProductViewModel[] = [];
    products.subscribe($products => {
        result = $products.filter(p => p.category?.toUpperCase() === category.toUpperCase());
    })();
    return result;
}

export function getVariantsByCategory(category: string) {
    let categoryProducts: ProductViewModel[] = [];
    let result: ProductVariantViewModel[] = [];

    products.subscribe($products => {
        categoryProducts = $products.filter(p =>
            p.category?.toUpperCase() === category.toUpperCase()
        );
    })();

    const productIds = categoryProducts.map(p => p.id);

    variants.subscribe($variants => {
        result = $variants.filter(v => productIds.includes(v.id));
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
    let result: ProductViewModel[] = [];

    store.subscribe(state => {
        const product = state.products.find(p => p.id === productId);
        if (product) {
            result = state.products.filter(p => p.isAccessory);
        }
    })();

    return result;
}

export function getProductVariants(productId: string) {
    let result: ProductVariantViewModel[] = [];

    variants.subscribe($variants => {
        result = $variants.filter(v => v.id === productId);
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

// Image-related functions
export function setImages(newImages: ProductImageViewModel[]) {
    store.update(state => ({
        ...state,
        images: newImages
    }));
}

export function getProductImages(productId: string) {
    let result: ProductImageViewModel[] = [];
    store.subscribe(state => {
        result = state.images.filter(img => img.productId === productId);
    })();
    return result;
} 
