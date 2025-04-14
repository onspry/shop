import { PrismaClient, type Cart, type CartItem, type ProductVariant, type ProductImage, type Product } from '@prisma/client';
import { randomUUID } from 'crypto';
import { type CartViewModel, type CartSummaryViewModel, CartStatus } from '$lib/models/cart';
import { toProductVariantViewModel } from './product-repository';
import { formatPrice } from '$lib/utils/price';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Simple in-memory cache implementation
class CartCache {
    private cache: Map<string, { data: CartViewModel; timestamp: number }> = new Map();

    set(key: string, data: CartViewModel): void {
        if (this.cache.size >= MAX_CACHE_SIZE) {
            this.evictOldest();
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key: string): CartViewModel | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTimestamp) {
                oldestTimestamp = value.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}

const cartCache = new CartCache();

// Define type for cart with items to avoid 'any'
export type CartWithItems = Cart & {
    items: Array<CartItem & {
        variant: ProductVariant & {
            product: {
                images: ProductImage[];
                id: string;
                name: string;
                slug: string;
                description: string;
            };
        };
        product: Product;
    }>;
};

// Define type for generic cart items for calculation purposes
export interface CartItemBase {
    price: number;
    quantity: number;
}

// Custom error types for better error handling
export class CartError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CartError';
    }
}

export class CartNotFoundError extends CartError {
    constructor(cartId: string) {
        super(`Cart not found: ${cartId}`);
        this.name = 'CartNotFoundError';
    }
}

export class StockError extends CartError {
    constructor(message: string) {
        super(message);
        this.name = 'StockError';
    }
}

export class DiscountError extends CartError {
    constructor(message: string) {
        super(message);
        this.name = 'DiscountError';
    }
}

// Define the repository class
export class CartRepository {
    /**
     * Cart repository for managing shopping cart operations.
     * Handles cart creation, item management, discounts, and user session management.
     */

    /**
     * Gets or creates a cart based on session ID and optional user ID.
     * @param sessionId - The session ID to identify the cart
     * @param userId - Optional user ID to associate with the cart
     * @returns Promise<CartViewModel> - The cart view model
     * @throws {CartError} If cart operations fail
     */
    async getOrCreateCart(sessionId: string, userId?: string | null): Promise<CartViewModel> {
        // Input validation
        if (!sessionId || typeof sessionId !== 'string') {
            throw new CartError('Invalid session ID');
        }
        if (userId && typeof userId !== 'string') {
            throw new CartError('Invalid user ID');
        }

        try {
            // Optimize by using a single query with OR condition
            const existingCart = await prisma.cart.findFirst({
                where: {
                    OR: [
                        // First priority: find cart with both sessionId and userId
                        userId && sessionId ? { userId, sessionId } : {},
                        // Second priority: find by userId
                        userId ? { userId } : {},
                        // Third priority: find by sessionId
                        sessionId ? { sessionId } : {}
                    ].filter(Boolean) // Remove empty conditions
                },
                include: {
                    // Include minimal cart items data for quick access
                    items: {
                        select: {
                            id: true,
                            quantity: true,
                            price: true
                        }
                    }
                }
            });

            // If we found a cart, update it if needed and return
            if (existingCart) {
                // If user is logged in but cart isn't associated, associate it now
                if (userId && existingCart.userId !== userId) {
                    await prisma.cart.update({
                        where: { id: existingCart.id },
                        data: { userId, updatedAt: new Date() }
                    });
                }

                // If session ID doesn't match, update it
                if (sessionId && existingCart.sessionId !== sessionId) {
                    await prisma.cart.update({
                        where: { id: existingCart.id },
                        data: { sessionId, updatedAt: new Date() }
                    });
                }

                // Calculate basic cart data without fetching everything
                const subtotal = existingCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discountAmount = existingCart.discountAmount || 0;

                // Return minimal cart data for faster response
                return {
                    id: existingCart.id,
                    items: [], // We'll fetch detailed items only when needed
                    discountCode: existingCart.discountCode,
                    discountAmount,
                    subtotal,
                    total: subtotal - discountAmount,
                    itemCount: existingCart.items.reduce((sum, item) => sum + item.quantity, 0)
                };
            }

            // No cart found, create a new one
            const newCart = await prisma.cart.create({
                data: {
                    id: randomUUID(),
                    sessionId: sessionId,
                    userId: userId,
                    status: CartStatus.ACTIVE // Using enum for type safety
                }
            });

            return {
                id: newCart.id,
                items: [],
                discountCode: null,
                discountAmount: 0,
                subtotal: 0,
                total: 0,
                itemCount: 0
            };
        } catch (error) {
            console.error('Error in getOrCreateCart:', error);
            throw new CartError('Failed to get or create cart');
        }
    }

    /**
     * Get cart with items and related product data (internal helper method)
     */
    async _getCartWithItems(cartId: string): Promise<CartWithItems | null> {
        try {
            // First, get the basic cart data with items but minimal nesting
            const cartData = await prisma.cart.findUnique({
                where: { id: cartId },
                include: {
                    items: {
                        include: {
                            variant: true,
                            product: true
                        }
                    }
                }
            });

            if (!cartData) {
                return null;
            }

            // If there are no items, return early
            if (cartData.items.length === 0) {
                return cartData as CartWithItems;
            }

            // Get all product IDs from the cart items
            const productIds = [...new Set(
                cartData.items.map(item =>
                    item.variant?.productId || item.productId
                ).filter(Boolean)
            )];

            // Fetch product images in a separate query
            const productImages = await prisma.productImage.findMany({
                where: {
                    productId: { in: productIds }
                },
                orderBy: {
                    position: 'asc'
                }
            });

            // Group images by product ID for easy lookup
            const imagesByProductId = productImages.reduce((acc, img) => {
                if (!acc[img.productId]) {
                    acc[img.productId] = [];
                }
                acc[img.productId].push(img);
                return acc;
            }, {} as Record<string, ProductImage[]>);

            // Enhance cart items with product images
            const enhancedItems = cartData.items.map(item => {
                const productId = item.variant?.productId || item.productId;
                if (productId && item.variant) {
                    // Add images to the product
                    const images = imagesByProductId[productId] || [];
                    // Create a product object if it doesn't exist
                    const product = {
                        id: productId,
                        name: item.product?.name || 'Product',
                        description: item.product?.description || '',
                        category: item.product?.category || '',
                        features: item.product?.features || [],
                        specifications: item.product?.specifications || {},
                        isAccessory: item.product?.isAccessory || false,
                        slug: item.product?.slug || '',
                        createdAt: item.product?.createdAt || new Date(),
                        updatedAt: item.product?.updatedAt || new Date(),
                        images
                    };

                    return {
                        ...item,
                        variant: {
                            ...item.variant,
                            product
                        }
                    };
                }
                return item;
            });

            // Return the enhanced cart data
            return {
                ...cartData,
                items: enhancedItems
            } as CartWithItems;
        } catch (error) {
            console.error('Error fetching cart with items:', error);
            return null;
        }
    }

    /**
     * Get cart view model by ID (internal helper)
     */
    async _getCartViewModelById(cartId: string): Promise<CartViewModel> {
        const cartData = await this._getCartWithItems(cartId);

        if (!cartData) {
            return {
                id: cartId,
                items: [],
                discountCode: null,
                discountAmount: 0,
                subtotal: 0,
                total: 0,
                itemCount: 0
            };
        }

        const items = cartData.items.map((item) => {
            const variantViewModel = toProductVariantViewModel({
                ...item.variant,
                createdAt: item.variant.createdAt,
                updatedAt: item.variant.updatedAt
            });
            const firstImage = item.variant.product?.images?.[0];

            return {
                id: item.id,
                cartId: item.cartId,
                quantity: item.quantity,
                price: item.price,
                variant: {
                    ...variantViewModel,
                    product: {
                        id: item.variant.productId,
                        name: item.variant.name,
                        slug: '',
                        description: null
                    }
                },
                imageUrl: firstImage?.url || '',
                composites: []
            };
        });

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            id: cartData.id,
            items,
            discountCode: cartData.discountCode,
            discountAmount: cartData.discountAmount || 0,
            subtotal,
            total: subtotal - (cartData.discountAmount || 0),
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
        };
    }

    /**
     * Gets the cart view model for a given session with caching.
     * @param sessionId - The session ID to identify the cart
     * @param userId - Optional user ID to associate with the cart
     * @param forceRefresh - Whether to bypass cache and force a fresh fetch
     * @returns Promise<CartViewModel> - The cart view model
     * @throws {CartError} If cart operations fail
     */
    async getCartViewModel(sessionId: string, userId?: string | null, forceRefresh: boolean = false): Promise<CartViewModel> {
        // Input validation
        if (typeof sessionId !== 'string') {
            throw new CartError('Invalid session ID type');
        }
        if (userId && typeof userId !== 'string') {
            throw new CartError('Invalid user ID');
        }

        // Try to get from cache first
        const cacheKey = `${sessionId}:${userId || 'guest'}`;
        if (!forceRefresh) {
            const cachedCart = cartCache.get(cacheKey);
            if (cachedCart) {
                return cachedCart;
            }
        }

        try {
            // If no session ID and no user ID, create a new cart
            if (!sessionId && !userId) {
                return await this.getOrCreateCart(randomUUID(), userId);
            }

            let existingCart = null;

            // Check for multiple carts with the same session ID
            if (sessionId) {
                const duplicateCarts = await prisma.cart.findMany({
                    where: {
                        sessionId: sessionId
                    }
                });

                if (duplicateCarts.length > 1) {
                    // Find the cart with items or keep the first one
                    let cartToKeep = duplicateCarts[0];
                    for (const dupCart of duplicateCarts) {
                        const items = await prisma.cartItem.findMany({
                            where: {
                                cartId: dupCart.id
                            }
                        });

                        if (items.length > 0) {
                            cartToKeep = dupCart;
                            break;
                        }
                    }

                    // Delete all other carts
                    for (const dupCart of duplicateCarts) {
                        if (dupCart.id !== cartToKeep.id) {
                            await prisma.cart.delete({
                                where: {
                                    id: dupCart.id
                                }
                            });
                        }
                    }

                    existingCart = cartToKeep;

                    // If logged in user, update the cart's user ID
                    if (userId && existingCart.userId !== userId) {
                        await prisma.cart.update({
                            where: {
                                id: existingCart.id
                            },
                            data: {
                                userId,
                                updatedAt: new Date()
                            }
                        });
                    }

                    return await this._getCartViewModelById(existingCart.id);
                }
            }

            // Try finding by user ID and session ID
            if (userId && sessionId) {
                existingCart = await prisma.cart.findFirst({
                    where: {
                        AND: [
                            { userId: userId },
                            { sessionId: sessionId }
                        ]
                    }
                });

                if (existingCart) {
                    return await this._getCartViewModelById(existingCart.id);
                }
            }

            // Try finding by user ID only
            if (userId) {
                existingCart = await prisma.cart.findFirst({
                    where: {
                        userId: userId
                    }
                });

                if (existingCart) {
                    // Update the sessionId if it doesn't match
                    if (sessionId && existingCart.sessionId !== sessionId) {
                        await prisma.cart.update({
                            where: {
                                id: existingCart.id
                            },
                            data: {
                                sessionId: sessionId,
                                updatedAt: new Date()
                            }
                        });
                    }

                    return await this._getCartViewModelById(existingCart.id);
                }
            }

            // Try finding by session ID only
            if (sessionId) {
                existingCart = await prisma.cart.findFirst({
                    where: {
                        sessionId: sessionId
                    }
                });

                if (existingCart) {
                    // If user is logged in but cart isn't associated, associate it now
                    if (userId && existingCart.userId !== userId) {
                        await prisma.cart.update({
                            where: {
                                id: existingCart.id
                            },
                            data: {
                                userId: userId,
                                updatedAt: new Date()
                            }
                        });
                    }

                    return await this._getCartViewModelById(existingCart.id);
                }
            }

            // No cart found, create a new one
            const result = await this.getOrCreateCart(sessionId, userId);

            // Cache the result before returning
            cartCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error in getCartViewModel:', error);
            throw new CartError('Failed to get cart view model');
        }
    }

    /**
     * Adds an item to the cart.
     * @param cartId - The ID of the cart to add the item to
     * @param productVariantId - The ID of the product variant to add
     * @param quantity - The quantity to add (default: 1)
     * @throws {CartError} If cart operations fail
     * @throws {StockError} If insufficient stock is available
     */
    async addItemToCart(
        cartId: string,
        productVariantId: string,
        quantity: number = 1
    ): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }
        if (!productVariantId || typeof productVariantId !== 'string') {
            throw new CartError('Invalid product variant ID');
        }
        if (quantity < 1 || !Number.isInteger(quantity)) {
            throw new CartError('Invalid quantity');
        }

        try {
            // Use a single transaction for all operations to improve performance
            const transactionResult = await prisma.$transaction(async (tx) => {
                // Get cart and variant data in parallel for better performance
                const [cartData, variant, existingItem] = await Promise.all([
                    // Get cart data
                    tx.cart.findUnique({
                        where: { id: cartId },
                        select: {
                            id: true,
                            sessionId: true,
                            userId: true
                        }
                    }),
                    // Get variant data
                    tx.productVariant.findUnique({
                        where: { id: productVariantId },
                        select: {
                            id: true,
                            price: true,
                            stockQuantity: true,
                            productId: true
                        }
                    }),
                    // Check for existing cart item
                    tx.cartItem.findFirst({
                        where: {
                            cartId: cartId,
                            variantId: productVariantId
                        }
                    })
                ]);

                // Validate cart and variant
                if (!cartData) {
                    throw new CartError('Cart not found');
                }

                if (!variant) {
                    throw new CartError('Product variant not found');
                }

                // Check stock availability
                if (variant.stockQuantity < quantity) {
                    throw new StockError(`Not enough stock available. Requested: ${quantity}, Available: ${variant.stockQuantity}`);
                }

                // Update or create cart item
                if (existingItem) {
                    // Update existing item
                    const newQuantity = existingItem.quantity + quantity;
                    if (newQuantity > variant.stockQuantity) {
                        throw new StockError(`Not enough stock available for total quantity. Requested: ${newQuantity}, Available: ${variant.stockQuantity}`);
                    }

                    await tx.cartItem.update({
                        where: { id: existingItem.id },
                        data: {
                            quantity: newQuantity,
                            updatedAt: new Date()
                        }
                    });
                } else {
                    // Create new item
                    await tx.cartItem.create({
                        data: {
                            id: randomUUID(),
                            cartId: cartId,
                            variantId: productVariantId,
                            productId: variant.productId,
                            quantity: quantity,
                            price: variant.price
                        }
                    });
                }

                // Update cart's last activity timestamp
                await tx.cart.update({
                    where: { id: cartId },
                    data: {
                        updatedAt: new Date(),
                        lastActivityAt: new Date()
                    }
                });

                // Return cart data for cache invalidation outside transaction
                return {
                    sessionId: cartData.sessionId,
                    userId: cartData.userId
                };
            });

            // Invalidate cache after successful update - but only for this specific cart
            // This is done outside the transaction for better performance
            const cacheKey = `${transactionResult.sessionId}:${transactionResult.userId || 'guest'}`;
            cartCache.delete(cacheKey);
        } catch (error) {
            if (error instanceof CartError || error instanceof StockError) {
                throw error;
            }
            console.error('[CART] Error adding item to cart:', error);
            throw new CartError('Failed to add item to cart: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Updates the quantity of a cart item.
     * Removes the item if quantity is 0 or less.
     * @param cartItemId - The ID of the cart item to update
     * @param quantity - The new quantity for the item
     * @throws {CartError} If cart operations fail
     * @throws {StockError} If insufficient stock is available
     */
    async updateCartItemQuantity(
        cartItemId: string,
        quantity: number
    ): Promise<void> {
        // Input validation
        if (!cartItemId || typeof cartItemId !== 'string') {
            throw new CartError('Invalid cart item ID');
        }
        if (typeof quantity !== 'number') {
            throw new CartError('Invalid quantity');
        }

        try {
            const item = await prisma.cartItem.findUnique({
                where: { id: cartItemId },
                select: {
                    cartId: true,
                    variantId: true
                }
            });

            if (!item) {
                throw new CartError('Cart item not found');
            }

            const cartId = item.cartId;
            const variantId = item.variantId;

            // Get cart data first
            const cartData = await prisma.cart.findUnique({
                where: { id: cartId },
                select: {
                    sessionId: true,
                    userId: true
                }
            });

            if (!cartData) {
                throw new CartError('Cart not found');
            }

            if (quantity <= 0) {
                // Delete the item if quantity is 0 or negative
                await prisma.$transaction(async (tx) => {
                    await tx.cartItem.delete({
                        where: { id: cartItemId }
                    });

                    await tx.cart.update({
                        where: { id: cartId },
                        data: {
                            updatedAt: new Date(),
                            lastActivityAt: new Date()
                        }
                    });
                });
            } else {
                // Check stock availability
                const variant = await prisma.productVariant.findUnique({
                    where: { id: variantId },
                    select: {
                        stockQuantity: true
                    }
                });

                if (!variant) {
                    throw new CartError('Product variant not found');
                }

                if (variant.stockQuantity < quantity) {
                    throw new StockError(`Not enough stock available. Requested: ${quantity}, Available: ${variant.stockQuantity}`);
                }

                // Update the item quantity
                await prisma.$transaction(async (tx) => {
                    await tx.cartItem.update({
                        where: { id: cartItemId },
                        data: {
                            quantity,
                            updatedAt: new Date()
                        }
                    });

                    await tx.cart.update({
                        where: { id: cartId },
                        data: {
                            updatedAt: new Date(),
                            lastActivityAt: new Date()
                        }
                    });
                });
            }

            // Invalidate cache after successful update
            const cacheKey = `${cartData.sessionId}:${cartData.userId || 'guest'}`;
            cartCache.delete(cacheKey);
        } catch (error) {
            if (error instanceof CartError || error instanceof StockError) {
                throw error;
            }
            console.error('Error updating cart item quantity:', error);
            throw new CartError('Failed to update cart item quantity');
        }
    }

    /**
     * Removes an item from the cart.
     * @param cartItemId - The ID of the cart item to remove
     * @throws {CartError} If cart operations fail
     */
    async removeCartItem(cartItemId: string): Promise<void> {
        // Input validation
        if (!cartItemId || typeof cartItemId !== 'string') {
            throw new CartError('Invalid cart item ID');
        }

        try {
            const item = await prisma.cartItem.findUnique({
                where: { id: cartItemId },
                select: {
                    cartId: true
                }
            });

            if (!item) {
                throw new CartError('Cart item not found');
            }

            const cartId = item.cartId;

            await prisma.$transaction(async (tx) => {
                // Get cart data first
                const cartData = await tx.cart.findUnique({
                    where: { id: cartId },
                    select: {
                        sessionId: true,
                        userId: true
                    }
                });

                if (!cartData) {
                    throw new CartError('Cart not found');
                }

                await tx.cartItem.delete({
                    where: { id: cartItemId }
                });

                await tx.cart.update({
                    where: { id: cartId },
                    data: {
                        updatedAt: new Date(),
                        lastActivityAt: new Date()
                    }
                });

                // Invalidate cache after successful removal
                const cacheKey = `${cartData.sessionId}:${cartData.userId || 'guest'}`;
                cartCache.delete(cacheKey);
            });
        } catch (error) {
            if (error instanceof CartError) {
                throw error;
            }
            console.error('Error removing cart item:', error);
            throw new CartError('Failed to remove cart item');
        }
    }

    /**
     * Clears all items from the cart and resets discounts.
     * @param cartId - The ID of the cart to clear
     * @throws {CartError} If cart operations fail
     */
    async clearCart(cartId: string): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }

        try {
            const cartData = await prisma.cart.findUnique({
                where: { id: cartId },
                select: {
                    sessionId: true,
                    userId: true
                }
            });

            if (!cartData) {
                throw new CartError('Cart not found');
            }

            await prisma.$transaction(async (tx) => {
                // Delete all cart items
                await tx.cartItem.deleteMany({
                    where: { cartId: cartId }
                });

                // Reset discount and update timestamps
                await tx.cart.update({
                    where: { id: cartId },
                    data: {
                        discountCode: null,
                        discountAmount: 0,
                        updatedAt: new Date(),
                        lastActivityAt: new Date()
                    }
                });

                // Invalidate cache after successful clear
                const cacheKey = `${cartData.sessionId}:${cartData.userId || 'guest'}`;
                cartCache.delete(cacheKey);
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw new CartError('Failed to clear cart');
        }
    }

    /**
     * Calculates a summary of the cart contents.
     * @param items - Array of cart items to calculate summary for
     * @param discountAmount - Optional discount amount to apply
     * @returns CartSummaryViewModel - The calculated cart summary
     */
    calculateCartSummary(items: CartItemBase[], discountAmount: number = 0): CartSummaryViewModel {
        // Input validation
        if (!Array.isArray(items)) {
            throw new CartError('Invalid items array');
        }
        if (typeof discountAmount !== 'number' || discountAmount < 0) {
            throw new CartError('Invalid discount amount');
        }

        if (!items || items.length === 0) {
            return {
                subtotal: 0,
                discountAmount: 0,
                total: 0,
                itemCount: 0
            };
        }

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal - discountAmount;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        return { subtotal, discountAmount, total, itemCount };
    }

    /**
     * Gets a summary of the cart for the current session.
     * @param sessionId - The session ID to get the cart summary for
     * @returns Promise<CartSummaryViewModel> - The cart summary
     */
    async getCartSummaryViewModel(sessionId: string): Promise<CartSummaryViewModel> {
        // Input validation
        if (!sessionId || typeof sessionId !== 'string') {
            throw new CartError('Invalid session ID');
        }

        try {
            const cartView = await this.getCartViewModel(sessionId);
            return this.calculateCartSummary(cartView.items, cartView.discountAmount);
        } catch (error) {
            console.error('Failed to get cart summary:', error);
            return { subtotal: 0, discountAmount: 0, total: 0, itemCount: 0 };
        }
    }

    /**
     * Applies a discount code to a cart
     * @param cartId - The ID of the cart to apply the discount to
     * @param discountCode - The discount code to apply
     * @throws {CartError} If cart operations fail
     * @throws {Error} If discount code is invalid or expired
     */
    async applyDiscountToCart(cartId: string, discountCode: string): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }
        if (!discountCode || typeof discountCode !== 'string') {
            throw new Error('Invalid discount code');
        }

        try {
            // Get the cart to calculate subtotal
            const cart = await this._getCartWithItems(cartId);
            if (!cart) {
                throw new CartError('Cart not found');
            }

            // Get the discount from the database
            const discount = await prisma.discount.findUnique({
                where: { code: discountCode }
            });

            if (!discount) {
                throw new Error('Discount code not found');
            }

            // Check if discount is active
            if (!discount.active) {
                throw new Error('Discount code is inactive');
            }

            // Check if discount is valid (date range)
            const now = new Date();
            if (discount.validFrom > now) {
                throw new Error('Discount code is not yet valid');
            }
            if (discount.validUntil && discount.validUntil < now) {
                throw new Error('Discount code has expired');
            }

            // Check if discount has reached max uses
            if (discount.maxUses && discount.usedCount >= discount.maxUses) {
                throw new Error('Discount code has reached maximum uses');
            }

            // Calculate cart subtotal
            const cartItems = cart.items.map(item => ({
                price: item.price,
                quantity: item.quantity
            }));
            const { subtotal } = this.calculateCartSummary(cartItems);

            // Check minimum spend requirement
            if (discount.minSpend && subtotal < discount.minSpend) {
                throw new Error(`Minimum spend of ${formatPrice(discount.minSpend)} required for this discount`);
            }

            // Calculate discount amount based on type
            let discountAmount = 0;
            switch (discount.type) {
                case 'percentage':
                    // value is percentage (e.g., 10 = 10%)
                    discountAmount = Math.round(subtotal * (discount.value / 100));
                    break;
                case 'fixed':
                    // value is fixed amount in cents
                    discountAmount = discount.value;
                    break;
                case 'shipping':
                    // Shipping discounts are handled at checkout
                    discountAmount = 0;
                    break;
                default:
                    throw new Error('Invalid discount type');
            }

            // Update the cart with the discount
            await prisma.cart.update({
                where: { id: cartId },
                data: {
                    discountCode: discount.code,
                    discountAmount: discountAmount,
                    updatedAt: new Date(),
                    lastActivityAt: new Date()
                }
            });

            // Increment the used count for the discount
            await prisma.discount.update({
                where: { id: discount.id },
                data: {
                    usedCount: { increment: 1 },
                    updatedAt: new Date()
                }
            });

            // Invalidate cache
            const cartData = await prisma.cart.findUnique({
                where: { id: cartId },
                select: { sessionId: true, userId: true }
            });

            if (cartData) {
                if (cartData.sessionId) {
                    cartCache.delete(`${cartData.sessionId}:guest`);
                }
                if (cartData.userId) {
                    cartCache.delete(`${cartData.sessionId}:${cartData.userId}`);
                }
            }
        } catch (error) {
            console.error('Error applying discount to cart:', error);
            if (error instanceof Error) {
                throw error; // Re-throw the original error
            }
            throw new CartError('Failed to apply discount to cart');
        }
    }

    /**
     * Removes a discount from a cart
     * @param cartId - The ID of the cart to remove the discount from
     * @throws {CartError} If cart operations fail
     */
    async removeDiscountFromCart(cartId: string): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }

        try {
            // Update the cart to remove the discount
            await prisma.cart.update({
                where: { id: cartId },
                data: {
                    discountCode: null,
                    discountAmount: 0,
                    updatedAt: new Date(),
                    lastActivityAt: new Date()
                }
            });

            // Invalidate cache
            const cartData = await prisma.cart.findUnique({
                where: { id: cartId },
                select: { sessionId: true, userId: true }
            });

            if (cartData) {
                if (cartData.sessionId) {
                    cartCache.delete(`${cartData.sessionId}:guest`);
                }
                if (cartData.userId) {
                    cartCache.delete(`${cartData.sessionId}:${cartData.userId}`);
                }
            }
        } catch (error) {
            console.error('Error removing discount from cart:', error);
            throw new CartError('Failed to remove discount from cart');
        }
    }

    /**
     * Handles merging carts when a user logs in
     * @param sessionId - The anonymous session ID
     * @param userId - The user ID to associate the cart with
     * @returns Promise<void>
     */
    async handleUserLoginMerge(sessionId: string, userId: string): Promise<void> {
        if (!sessionId || !userId) {
            throw new CartError('Invalid session ID or user ID');
        }

        try {
            // Find anonymous cart
            const anonymousCart = await prisma.cart.findFirst({
                where: { sessionId: sessionId, userId: null },
                include: { items: true }
            });

            // Find user cart
            const userCart = await prisma.cart.findFirst({
                where: { userId: userId },
                include: { items: true }
            });

            // If no anonymous cart, nothing to merge
            if (!anonymousCart) {
                // If user has no cart, create one
                if (!userCart) {
                    await prisma.cart.create({
                        data: {
                            id: randomUUID(),
                            sessionId: sessionId,
                            userId: userId,
                            status: CartStatus.ACTIVE // Using enum for type safety
                        }
                    });
                } else {
                    // Update session ID on existing user cart
                    await prisma.cart.update({
                        where: { id: userCart.id },
                        data: { sessionId: sessionId }
                    });
                }
                return;
            }

            // If user has no cart, just update the anonymous cart
            if (!userCart) {
                await prisma.cart.update({
                    where: { id: anonymousCart.id },
                    data: { userId: userId }
                });
                return;
            }

            // Both carts exist, need to merge items
            await prisma.$transaction(async (tx) => {
                // Move items from anonymous cart to user cart
                for (const item of anonymousCart.items) {
                    // Check if item already exists in user cart
                    const existingItem = userCart.items.find(i => i.variantId === item.variantId);

                    if (existingItem) {
                        // Update quantity of existing item
                        await tx.cartItem.update({
                            where: { id: existingItem.id },
                            data: {
                                quantity: existingItem.quantity + item.quantity,
                                updatedAt: new Date()
                            }
                        });
                    } else {
                        // Create new item in user cart
                        await tx.cartItem.create({
                            data: {
                                id: randomUUID(),
                                cartId: userCart.id,
                                variantId: item.variantId,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price
                            }
                        });
                    }
                }

                // Update user cart
                await tx.cart.update({
                    where: { id: userCart.id },
                    data: {
                        sessionId: sessionId,
                        updatedAt: new Date(),
                        lastActivityAt: new Date()
                    }
                });

                // Delete anonymous cart
                await tx.cart.delete({
                    where: { id: anonymousCart.id }
                });
            });

            // Invalidate cache
            cartCache.delete(`${sessionId}:guest`);
            cartCache.delete(`${sessionId}:${userId}`);
        } catch (error) {
            console.error('Error merging carts:', error);
            throw new CartError('Failed to merge carts');
        }
    }
}

// Export an instance of the repository
export const cartRepository = new CartRepository();
