import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '$lib/server/db';
import { cart, type NewCart, type Cart } from '$lib/server/db/schema/cart';
import { cartItem, type NewCartItem, type CartItem } from '$lib/server/db/schema/cart_item';
import { productVariant, type ProductVariant } from '$lib/server/db/schema/product_variant';
import type { ProductImage } from '$lib/server/db/schema/product_image';
import { discount } from '$lib/server/db/schema/discount';
import type { CartViewModel, CartSummaryViewModel } from '$lib/models/cart';
import { toProductVariantViewModel } from '$lib/models/product';

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
        variant: Pick<ProductVariant, 'id' | 'sku' | 'name' | 'price' | 'stockQuantity' | 'attributes' | 'productId'> & {
            product: {
                images: ProductImage[];
            };
        };
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

// Define the repository object
export const cartRepository = {
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

        // Check for existing cart by user ID
        let existingCart = null;

        if (userId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.userId, userId)
            });
        }

        // If no user cart, check for session cart
        if (!existingCart && sessionId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.sessionId, sessionId)
            });
        }

        // If we found a cart, return it
        if (existingCart) {
            return await this._getCartViewModelById(existingCart.id);
        }

        // No cart found, create a new one
        const newCartData: NewCart = {
            id: randomUUID(),
            sessionId: sessionId,
            userId: userId || null
        };
        await db.insert(cart).values(newCartData);

        return {
            id: newCartData.id,
            items: [],
            discountCode: null,
            discountAmount: 0,
            subtotal: 0,
            total: 0,
            itemCount: 0
        };
    },

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

        // If no session ID and no user ID, create a new cart
        if (!sessionId && !userId) {
            return await this.getOrCreateCart(randomUUID(), userId);
        }

        let existingCart = null;

        // FIRST: Check for multiple carts with the same session ID (error condition)
        // This helps clean up corrupted data
        if (sessionId) {
            const duplicateCarts = await db.query.cart.findMany({
                where: eq(cart.sessionId, sessionId)
            });

            if (duplicateCarts.length > 1) {
                // Find the cart with items or keep the first one
                let cartToKeep = duplicateCarts[0];
                for (const dupCart of duplicateCarts) {
                    const items = await db.query.cartItem.findMany({
                        where: eq(cartItem.cartId, dupCart.id)
                    });

                    if (items.length > 0) {
                        cartToKeep = dupCart;
                        break;
                    }
                }

                // Delete all other carts
                for (const dupCart of duplicateCarts) {
                    if (dupCart.id !== cartToKeep.id) {
                        await db.delete(cart).where(eq(cart.id, dupCart.id));
                    }
                }

                existingCart = cartToKeep;

                // If logged in user, update the cart's user ID
                if (userId && existingCart.userId !== userId) {
                    await db.update(cart)
                        .set({
                            userId,
                            updatedAt: sql`(unixepoch())`
                        })
                        .where(eq(cart.id, existingCart.id));
                }

                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // SECOND: Try finding by BOTH user ID AND session ID
        if (userId && sessionId) {
            existingCart = await db.query.cart.findFirst({
                where: and(
                    eq(cart.userId, userId),
                    eq(cart.sessionId, sessionId)
                )
            });

            if (existingCart) {
                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // THIRD: Try finding by user ID only
        if (userId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.userId, userId)
            });

            if (existingCart) {
                // Update the sessionId if it doesn't match
                if (sessionId && existingCart.sessionId !== sessionId) {
                    await db.update(cart)
                        .set({
                            sessionId: sessionId,
                            updatedAt: sql`(unixepoch())`
                        })
                        .where(eq(cart.id, existingCart.id));
                }

                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // FOURTH: Try finding by session ID only
        if (sessionId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.sessionId, sessionId)
            });

            if (existingCart) {
                // If user is logged in but cart isn't associated, associate it now
                if (userId && existingCart.userId !== userId) {
                    await db.update(cart)
                        .set({
                            userId: userId,
                            updatedAt: sql`(unixepoch())`
                        })
                        .where(eq(cart.id, existingCart.id));
                }

                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // No cart found, create a new one
        const result = await this.getOrCreateCart(sessionId, userId);

        // Cache the result before returning
        cartCache.set(cacheKey, result);
        return result;
    },

    /**
     * Get cart with items and related product data (internal helper type)
     */
    async _getCartWithItems(cartId: string): Promise<CartWithItems | null> {
        try {
            const cartData = await db.query.cart.findFirst({
                where: eq(cart.id, cartId),
                with: {
                    items: {
                        with: {
                            variant: {
                                with: {
                                    product: {
                                        with: {
                                            images: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!cartData) {
                return null;
            }

            return cartData as CartWithItems;
        } catch (error) {
            console.error('Error fetching cart with items:', error);
            return null;
        }
    },

    /**
     * Get cart view model by ID (internal helper)
     */
    async _getCartViewModelById(cartId: string): Promise<CartViewModel> {
        const cartData = await this._getCartWithItems(cartId);

        if (!cartData) {
            // This case should ideally be handled by getOrCreateCart, but return empty as fallback
            return {
                id: cartId, // Return requested ID even if not found
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
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const firstImage = item.variant.product?.images?.[0];
            return {
                id: item.id,
                cartId: item.cartId,
                quantity: item.quantity,
                price: item.price,
                productVariantId: item.productVariantId,
                variant: variantViewModel,
                imageUrl: firstImage?.url || '',
                name: item.variant.name,
                composites: (item.composites || []).map(composite => ({
                    variantId: composite.variantId,
                    name: composite.name,
                    quantity: composite.quantity,
                    variant: toProductVariantViewModel({
                        id: composite.variantId,
                        name: composite.name,
                        price: 0,
                        stockQuantity: 0,
                        attributes: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        productId: '',
                        sku: ''
                    })
                }))
            };
        });

        const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);

        return {
            id: cartData.id,
            items,
            discountCode: cartData.discountCode,
            discountAmount: cartData.discountAmount || 0,
            subtotal,
            total: subtotal - (cartData.discountAmount || 0),
            itemCount: items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)
        };
    },

    /**
     * Adds an item to the cart with optional composite items.
     * @param cartId - The ID of the cart to add the item to
     * @param productVariantId - The ID of the product variant to add
     * @param quantity - The quantity to add (default: 1)
     * @param composites - Optional array of composite items to add with the main item
     * @throws {CartError} If cart operations fail
     * @throws {StockError} If insufficient stock is available
     */
    async addItemToCart(
        cartId: string,
        productVariantId: string,
        quantity: number = 1,
        composites: Array<{
            variantId: string;
            name: string;
            quantity: number;
        }> = []
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
        if (!Array.isArray(composites)) {
            throw new CartError('Invalid composites array');
        }

        // Validate composite items
        for (const composite of composites) {
            if (!composite.variantId || !composite.name || !composite.quantity) {
                throw new CartError('Invalid composite item structure');
            }
            if (composite.quantity < 1 || !Number.isInteger(composite.quantity)) {
                throw new CartError('Invalid composite quantity');
            }
        }

        try {
            // Start a transaction
            await db.transaction(async (tx) => {
                // Get cart data first
                const cartData = await tx.query.cart.findFirst({
                    where: eq(cart.id, cartId),
                    columns: {
                        sessionId: true,
                        userId: true
                    }
                });

                if (!cartData) {
                    throw new CartError('Cart not found');
                }

                // Check main variant stock
                const variant = await tx.query.productVariant.findFirst({
                    where: eq(productVariant.id, productVariantId),
                    columns: {
                        id: true,
                        price: true,
                        stockQuantity: true
                    }
                });

                if (!variant) {
                    throw new CartError('Product variant not found');
                }

                if (variant.stockQuantity < quantity) {
                    throw new StockError(`Not enough stock available. Requested: ${quantity}, Available: ${variant.stockQuantity}`);
                }

                // Get all cart items for this variant
                const existingItems = await tx.query.cartItem.findMany({
                    where: and(
                        eq(cartItem.cartId, cartId),
                        eq(cartItem.productVariantId, productVariantId)
                    )
                });

                // Find an item with matching composites
                const matchingItem = existingItems.find(item => {
                    const itemComposites = item.composites || [];

                    // If lengths don't match, it's not the same configuration
                    if (itemComposites.length !== composites.length) {
                        return false;
                    }

                    // Check if all composites match
                    return composites.every(newComposite => {
                        return itemComposites.some(existing =>
                            existing.variantId === newComposite.variantId &&
                            existing.name === newComposite.name &&
                            existing.quantity === newComposite.quantity
                        );
                    });
                });

                if (matchingItem) {
                    // Update existing item with same configuration
                    const newQuantity = matchingItem.quantity + quantity;
                    if (newQuantity > variant.stockQuantity) {
                        throw new StockError(`Not enough stock available for total quantity. Requested: ${newQuantity}, Available: ${variant.stockQuantity}`);
                    }

                    await tx.update(cartItem)
                        .set({
                            quantity: newQuantity,
                            updatedAt: sql`(unixepoch())`
                        })
                        .where(eq(cartItem.id, matchingItem.id));
                } else {
                    // Create new item with new configuration
                    const newItem: NewCartItem = {
                        id: randomUUID(),
                        cartId,
                        productVariantId,
                        quantity,
                        price: variant.price,
                        composites: composites
                    };

                    await tx.insert(cartItem).values(newItem);
                }

                // Check and update composite items stock
                for (const composite of composites) {
                    const compositeVariant = await tx.query.productVariant.findFirst({
                        where: eq(productVariant.id, composite.variantId),
                        columns: {
                            id: true,
                            stockQuantity: true
                        }
                    });

                    if (!compositeVariant) {
                        throw new CartError(`Composite product variant not found: ${composite.variantId}`);
                    }

                    if (compositeVariant.stockQuantity < composite.quantity * quantity) {
                        throw new StockError(`Not enough stock available for composite item. Requested: ${composite.quantity * quantity}, Available: ${compositeVariant.stockQuantity}`);
                    }
                }

                await tx.update(cart)
                    .set({ updatedAt: sql`(unixepoch())` })
                    .where(eq(cart.id, cartId));

                // Invalidate cache after successful update
                const cacheKey = `${cartData.sessionId}:${cartData.userId || 'guest'}`;
                cartCache.delete(cacheKey);
            });
        } catch (error) {
            if (error instanceof CartError || error instanceof StockError) {
                throw error;
            }
            console.error('[CART] Error adding item to cart:', error);
            throw new CartError('Failed to add item to cart: ' + (error instanceof Error ? error.message : String(error)));
        }
    },

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
            const item = await db.query.cartItem.findFirst({
                where: eq(cartItem.id, cartItemId),
                columns: {
                    cartId: true,
                    productVariantId: true
                }
            });

            if (!item) {
                throw new CartError('Cart item not found');
            }

            const cartId = item.cartId;
            const variantId = item.productVariantId;

            // Get cart data first
            const cartData = await db.query.cart.findFirst({
                where: eq(cart.id, cartId),
                columns: {
                    sessionId: true,
                    userId: true
                }
            });

            if (!cartData) {
                throw new CartError('Cart not found');
            }

            if (quantity <= 0) {
                await db.transaction(async (tx) => {
                    await tx.delete(cartItem).where(eq(cartItem.id, cartItemId));
                    await tx.update(cart)
                        .set({ updatedAt: sql`(unixepoch())` })
                        .where(eq(cart.id, cartId));
                });
            } else {
                const variant = await db.query.productVariant.findFirst({
                    where: eq(productVariant.id, variantId)
                });

                if (!variant) {
                    throw new CartError('Product variant not found');
                }

                if (variant.stockQuantity !== undefined && quantity > variant.stockQuantity) {
                    throw new StockError('Not enough stock available');
                }

                await db.transaction(async (tx) => {
                    await tx.update(cartItem)
                        .set({
                            quantity,
                            updatedAt: sql`(unixepoch())`
                        })
                        .where(eq(cartItem.id, cartItemId));
                    await tx.update(cart)
                        .set({ updatedAt: sql`(unixepoch())` })
                        .where(eq(cart.id, cartId));
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
    },

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
            const item = await db.query.cartItem.findFirst({
                where: eq(cartItem.id, cartItemId),
                columns: {
                    cartId: true
                }
            });

            if (!item) {
                throw new CartError('Cart item not found');
            }

            const cartId = item.cartId;

            await db.transaction(async (tx) => {
                // Get cart data first
                const cartData = await tx.query.cart.findFirst({
                    where: eq(cart.id, cartId),
                    columns: {
                        sessionId: true,
                        userId: true
                    }
                });

                if (!cartData) {
                    throw new CartError('Cart not found');
                }

                await tx.delete(cartItem).where(eq(cartItem.id, cartItemId));
                await tx.update(cart)
                    .set({ updatedAt: sql`(unixepoch())` })
                    .where(eq(cart.id, cartId));

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
    },

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
            const cartData = await db.query.cart.findFirst({
                where: eq(cart.id, cartId),
                columns: {
                    sessionId: true,
                    userId: true
                }
            });

            if (!cartData) {
                throw new CartError('Cart not found');
            }

            await db.transaction(async (tx) => {
                await tx.delete(cartItem).where(eq(cartItem.cartId, cartId));
                await tx.update(cart)
                    .set({
                        discountCode: null,
                        discountAmount: 0,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, cartId));

                // Invalidate cache after successful clear
                const cacheKey = `${cartData.sessionId}:${cartData.userId || 'guest'}`;
                cartCache.delete(cacheKey);
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw new CartError('Failed to clear cart');
        }
    },

    /**
     * Applies a discount code to the cart.
     * @param cartId - The ID of the cart to apply the discount to
     * @param code - The discount code to apply
     * @throws {CartError} If cart operations fail
     * @throws {DiscountError} If discount code is invalid or expired
     */
    async applyDiscountToCart(
        cartId: string,
        code: string
    ): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }
        if (!code || typeof code !== 'string') {
            throw new DiscountError('Invalid discount code');
        }

        try {
            const discountCode = await db.query.discount.findFirst({
                where: and(
                    eq(discount.code, code),
                    eq(discount.active, true),
                )
            });

            if (!discountCode) {
                throw new DiscountError('Invalid discount code');
            }

            const now = Math.floor(Date.now() / 1000);
            if (discountCode.validUntil && typeof discountCode.validUntil === 'number' && discountCode.validUntil < now) {
                throw new DiscountError('Discount code has expired');
            }

            if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
                throw new DiscountError('Discount code has reached maximum usage');
            }

            const cartWithItems = await this._getCartWithItems(cartId); // Use internal method

            if (!cartWithItems || !cartWithItems.items || cartWithItems.items.length === 0) {
                throw new CartError('Cart is empty, cannot apply discount');
            }

            const cartTotal = cartWithItems.items.reduce(
                (sum: number, item: { price: number; quantity: number }) => {
                    if (item && item.price && item.quantity) {
                        return sum + (item.price * item.quantity);
                    }
                    return sum;
                },
                0
            );

            if (discountCode.minSpend && cartTotal < discountCode.minSpend) {
                throw new DiscountError(`Minimum spend of ${discountCode.minSpend / 100} required`);
            }

            let discountAmount = 0;
            if (discountCode.type === 'percentage') {
                discountAmount = Math.round(cartTotal * (discountCode.value / 100));
            } else if (discountCode.type === 'fixed') {
                discountAmount = Math.min(cartTotal, discountCode.value);
            } else if (discountCode.type === 'shipping') {
                discountAmount = discountCode.value; // Assuming shipping cost handled elsewhere
            }

            await db.transaction(async (tx) => {
                await tx.update(cart)
                    .set({
                        discountCode: code,
                        discountAmount,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, cartId));

                await tx.update(discount)
                    .set({
                        usedCount: discountCode.usedCount + 1,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(discount.id, discountCode.id));
            });

        } catch (error) {
            if (error instanceof CartError || error instanceof DiscountError) {
                throw error;
            }
            console.error('Error applying discount to cart:', error);
            throw new CartError('Failed to apply discount');
        }
    },

    /**
     * Removes the current discount from the cart.
     * @param cartId - The ID of the cart to remove the discount from
     * @throws {CartError} If cart operations fail
     */
    async removeDiscountFromCart(cartId: string): Promise<void> {
        // Input validation
        if (!cartId || typeof cartId !== 'string') {
            throw new CartError('Invalid cart ID');
        }

        try {
            await db.update(cart)
                .set({
                    discountCode: null,
                    discountAmount: 0,
                    updatedAt: sql`(unixepoch())`
                })
                .where(eq(cart.id, cartId));
        } catch (error) {
            console.error('Error removing discount:', error);
            throw new CartError('Failed to remove discount');
        }
    },

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
    },

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
    },

    /**
     * Sets the guest email for checkout.
     * @param sessionId - The session ID to set the email for
     * @param email - The email address to set
     * @param userId - Optional user ID if user is logged in
     * @throws {CartError} If cart operations fail
     */
    async setGuestEmail(sessionId: string, email: string, userId?: string | null): Promise<void> {
        // Input validation
        if (!sessionId || typeof sessionId !== 'string') {
            throw new CartError('Invalid session ID');
        }
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            throw new CartError('Invalid email address');
        }
        if (userId && typeof userId !== 'string') {
            throw new CartError('Invalid user ID');
        }

        try {
            // Ensure cart exists for session
            const guestCart = await this.getOrCreateCart(sessionId, userId);

            await db.update(cart)
                .set({
                    guestEmail: email,
                    updatedAt: sql`(unixepoch())`
                })
                .where(eq(cart.id, guestCart.id));
        } catch (error) {
            if (error instanceof CartError) throw error;
            console.error('Error setting guest email:', error);
            throw new CartError('Failed to set guest email');
        }
    },

    /**
     * Handles merging user's old carts into the current session cart upon login.
     * @param sessionId - The current session ID
     * @param userId - The user ID to merge carts for
     * @returns Promise<string | null> - The ID of the final user cart, or null if operation fails
     */
    async handleUserLoginMerge(sessionId: string, userId: string): Promise<string | null> {
        // Input validation
        if (!sessionId || typeof sessionId !== 'string') {
            throw new CartError('Invalid session ID');
        }
        if (!userId || typeof userId !== 'string') {
            throw new CartError('Invalid user ID');
        }

        try {
            // Validation
            if (!sessionId || sessionId.trim() === '') {
                return null;
            }

            if (!userId) {
                return null;
            }

            // Step 1: Find existing cart by BOTH user ID AND session ID first
            // This handles the case where this function might be called multiple times
            const existingLinkedCart = await db.query.cart.findFirst({
                where: and(
                    eq(cart.userId, userId),
                    eq(cart.sessionId, sessionId)
                )
            });

            if (existingLinkedCart) {
                return existingLinkedCart.id;
            }

            // Step 2: Find existing cart by session ID
            const sessionCart = await db.query.cart.findFirst({
                where: eq(cart.sessionId, sessionId)
            });

            // Step 3: Find existing cart by user ID
            const userCart = await db.query.cart.findFirst({
                where: eq(cart.userId, userId)
            });

            // Step 4: Determine which cart to keep and merge items
            if (sessionCart && userCart) {
                // Get items from both carts
                const sessionCartItems = await db.query.cartItem.findMany({
                    where: eq(cartItem.cartId, sessionCart.id)
                });

                const userCartItems = await db.query.cartItem.findMany({
                    where: eq(cartItem.cartId, userCart.id)
                });

                // Keep the session cart as the primary cart
                // Update it with the user ID
                await db.update(cart)
                    .set({
                        userId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, sessionCart.id));

                // Move all items from user cart to session cart
                for (const item of userCartItems) {
                    // Check if an identical item exists in the session cart
                    const existingItem = sessionCartItems.find(
                        sessionItem =>
                            sessionItem.productVariantId === item.productVariantId &&
                            JSON.stringify(sessionItem.composites) === JSON.stringify(item.composites)
                    );

                    if (existingItem) {
                        // Update quantity of existing item
                        await db.update(cartItem)
                            .set({
                                quantity: existingItem.quantity + item.quantity,
                                updatedAt: sql`(unixepoch())`
                            })
                            .where(eq(cartItem.id, existingItem.id));
                    } else {
                        // Create new item in session cart
                        await db.insert(cartItem).values({
                            ...item,
                            id: randomUUID(),
                            cartId: sessionCart.id,
                            createdAt: sql`(unixepoch())`,
                            updatedAt: sql`(unixepoch())`
                        });
                    }
                }

                // Delete the user cart after items are merged
                await db.delete(cart)
                    .where(eq(cart.id, userCart.id));

                return sessionCart.id;
            }

            // If we only have a session cart, update it with the user ID
            if (sessionCart) {
                await db.update(cart)
                    .set({
                        userId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, sessionCart.id));

                return sessionCart.id;
            }

            // If we only have a user cart, update it with the session ID
            if (userCart) {
                await db.update(cart)
                    .set({
                        sessionId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, userCart.id));

                return userCart.id;
            }

            // If no carts exist, create a new one
            const newCart = await this.getOrCreateCart(sessionId, userId);
            return newCart.id;
        } catch (error) {
            console.error('[CART] Login Merge: Error during merge:', error);
            return null;
        }
    }
};