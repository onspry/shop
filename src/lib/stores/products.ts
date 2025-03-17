import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';
import { writable, derived } from 'svelte/store';

// Create writable stores for the base state
const productsStore = writable<Product[]>([]);
const variantsStore = writable<ProductVariant[]>([]);
const imagesStore = writable<ProductImage[]>([]);
const selectedProductStore = writable<Product | null>(null);
const loadingStore = writable(false);
const errorStore = writable<string | null>(null);

// Derived stores for product categories
const keyboardProduct = derived(productsStore, $products =>
    $products.find(p => !p.isAccessory && p.category?.toUpperCase() === 'KEYBOARD')
);

const switchesProduct = derived(productsStore, $products =>
    $products.find(p => p.category?.toUpperCase() === 'SWITCHES')
);

const keycapsProduct = derived(productsStore, $products =>
    $products.find(p => p.category?.toUpperCase() === 'KEYCAPS')
);

const accessories = derived(productsStore, $products =>
    $products.filter(p => p.isAccessory)
);

const accessoryCategories = derived(accessories, $accessories => {
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
function setProducts(newProducts: Product[]) {
    productsStore.set(newProducts);
}

function setVariants(newVariants: ProductVariant[]) {
    variantsStore.set(newVariants);
}

function setImages(newImages: ProductImage[]) {
    imagesStore.set(newImages);
}

// Repository-aware actions
function loadKeyboardWithAccessories(
    keyboard: Product,
    keyboardVariants: ProductVariant[],
    keyboardImages: ProductImage[],
    accessories: Product[],
    accessoryVariants: ProductVariant[],
    accessoryImages: ProductImage[]
) {
    // Load everything into the store at once
    setProducts([keyboard, ...accessories]);
    setVariants([...keyboardVariants, ...accessoryVariants]);
    setImages([...keyboardImages, ...accessoryImages]);
}

function addProduct(product: Product) {
    productsStore.update($products => {
        // Don't add duplicates
        if ($products.some(p => p.id === product.id)) {
            return $products;
        }
        return [...$products, product];
    });
}

function addVariants(productVariants: ProductVariant[]) {
    variantsStore.update($variants => {
        // Filter out duplicates
        const newVariants = productVariants.filter(v =>
            !$variants.some(existing => existing.id === v.id)
        );
        return [...$variants, ...newVariants];
    });
}

function addImages(productImages: ProductImage[]) {
    imagesStore.update($images => {
        // Filter out duplicates
        const newImages = productImages.filter(i =>
            !$images.some(existing => existing.id === i.id)
        );
        return [...$images, ...newImages];
    });
}

// Category-based selectors
function getProductsByCategory(category: string) {
    let result: Product[] = [];
    productsStore.subscribe($products => {
        result = $products.filter(p => p.category?.toUpperCase() === category.toUpperCase());
    });
    return result;
}

function getVariantsByCategory(category: string) {
    let categoryProducts: Product[] = [];
    let result: ProductVariant[] = [];

    productsStore.subscribe($products => {
        categoryProducts = $products.filter(p =>
            p.category?.toUpperCase() === category.toUpperCase()
        );
    });

    const productIds = categoryProducts.map(p => p.id);

    variantsStore.subscribe($variants => {
        result = $variants.filter(v => productIds.includes(v.productId));
    });

    return result;
}

function getImagesByCategory(category: string) {
    let categoryProducts: Product[] = [];
    let result: ProductImage[] = [];

    productsStore.subscribe($products => {
        categoryProducts = $products.filter(p =>
            p.category?.toUpperCase() === category.toUpperCase()
        );
    });

    const productIds = categoryProducts.map(p => p.id);

    imagesStore.subscribe($images => {
        result = $images.filter(i => productIds.includes(i.productId));
    });

    return result;
}

// Actions
async function fetchProducts() {
    loadingStore.set(true);
    errorStore.set(null);
    try {
        // Just a placeholder - data will come from the page
    } catch (e) {
        errorStore.set(e instanceof Error ? e.message : 'An error occurred');
    } finally {
        loadingStore.set(false);
    }
}

function selectProduct(productId: string) {
    productsStore.update($products => {
        const selected = $products.find(p => p.id === productId) ?? null;
        selectedProductStore.set(selected);
        return $products;
    });
}

function getCompatibleAccessories(productId: string) {
    let result: Product[] = [];
    accessories.subscribe($accessories => {
        productsStore.subscribe($products => {
            const product = $products.find(p => p.id === productId);
            if (product) {
                result = $accessories;
            }
        });
    });
    return result;
}

function getProductVariants(productId: string) {
    let result: ProductVariant[] = [];
    variantsStore.subscribe($variants => {
        result = $variants.filter(v => v.productId === productId);
    });
    return result;
}

function getProductImages(productId: string) {
    let result: ProductImage[] = [];
    imagesStore.subscribe($images => {
        result = $images.filter(i => i.productId === productId);
    });
    return result;
}

// Export the stores and functions
export {
    productsStore as products,
    variantsStore as variants,
    imagesStore as images,
    selectedProductStore as selectedProduct,
    loadingStore as loading,
    errorStore as error,

    // Derived stores
    keyboardProduct,
    switchesProduct,
    keycapsProduct,
    accessories,
    accessoryCategories,

    // Basic setter functions
    setProducts,
    setVariants,
    setImages,

    // Repository-aware actions
    loadKeyboardWithAccessories,
    addProduct,
    addVariants,
    addImages,

    // Category-based selectors
    getProductsByCategory,
    getVariantsByCategory,
    getImagesByCategory,

    // Original functions
    fetchProducts,
    selectProduct,
    getCompatibleAccessories,
    getProductVariants,
    getProductImages
}; 