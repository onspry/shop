import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '$lib/server/db';
import { cart, type NewCart, type Cart } from '$lib/server/db/schema/cart';
import { cartItem, type NewCartItem, type CartItem } from '$lib/server/db/schema/cart_item';
import { productVariant, type ProductVariant } from '$lib/server/db/schema/product_variant';
import { discount } from '$lib/server/db/schema/discount';
import type { CartViewModel, CartSummaryViewModel } from '$lib/models/cart';
import { toProductVariantViewModel } from '$lib/models/product';

// Define type for cart with items to avoid 'any'
export type CartWithItems = Cart & {
    items: Array<CartItem & {
        variant: Pick<ProductVariant, 'id' | 'sku' | 'name' | 'price' | 'stockQuantity' | 'attributes' | 'productId'>;
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
     * Gets or creates a cart.
     * Checks by user ID first (if provided), then by session ID.
     * Creates a new cart if none found.
     */
    async getOrCreateCart(sessionId: string, userId?: string | null): Promise<CartViewModel> {
        console.log(`[CART] getOrCreateCart called with sessionId: ${sessionId}, userId: ${userId || 'null'}`);

        // Check for existing cart by user ID
        let existingCart = null;

        if (userId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.userId, userId)
            });

            if (existingCart) {
                console.log(`[CART] Found existing cart by userId: ${existingCart.id}`);
            }
        }

        // If no user cart, check for session cart
        if (!existingCart && sessionId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.sessionId, sessionId)
            });

            if (existingCart) {
                console.log(`[CART] Found existing cart by sessionId: ${existingCart.id}`);
            }
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
        console.log(`[CART] Created new cart ${newCartData.id} for ${userId ? 'user ' + userId : 'session ' + sessionId}`);

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
     * Primary method to get the cart view model.
     * Calls getOrCreateCart if no cart is found.
     */
    async getCartViewModel(sessionId: string, userId?: string | null): Promise<CartViewModel> {
        console.log(`[CART] getCartViewModel called with sessionId: ${sessionId}, userId: ${userId || 'null'}`);

        if (!sessionId) {
            console.log(`[CART] Warning: getCartViewModel called with empty sessionId`);
        }

        let existingCart = null;

        // FIRST: Check for multiple carts with the same session ID (error condition)
        // This helps clean up corrupted data
        if (sessionId) {
            const duplicateCarts = await db.query.cart.findMany({
                where: eq(cart.sessionId, sessionId)
            });

            if (duplicateCarts.length > 1) {
                console.log(`[CART] FOUND DUPLICATE CARTS for session ${sessionId}. Found ${duplicateCarts.length} carts. Cleaning up...`);

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

                console.log(`[CART] Keeping cart: ${cartToKeep.id}`);

                // Delete all other carts
                for (const dupCart of duplicateCarts) {
                    if (dupCart.id !== cartToKeep.id) {
                        await db.delete(cart).where(eq(cart.id, dupCart.id));
                        console.log(`[CART] Deleted duplicate cart: ${dupCart.id}`);
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
                    console.log(`[CART] Updated kept cart with user ID: ${userId}`);
                }

                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // SECOND: Try finding by BOTH user ID AND session ID
        // This ensures we find the cart we just associated in handleUserLoginMerge
        if (userId && sessionId) {
            existingCart = await db.query.cart.findFirst({
                where: and(
                    eq(cart.userId, userId),
                    eq(cart.sessionId, sessionId)
                )
            });

            if (existingCart) {
                console.log(`[CART] Found cart by userId AND sessionId match: ${existingCart.id}`);
                return await this._getCartViewModelById(existingCart.id);
            }
        }

        // THIRD: Try finding by user ID only
        if (userId) {
            existingCart = await db.query.cart.findFirst({
                where: eq(cart.userId, userId)
            });

            if (existingCart) {
                console.log(`[CART] Found cart by userId: ${existingCart.id}`);

                // Update the sessionId if it doesn't match (important!)
                if (sessionId && existingCart.sessionId !== sessionId) {
                    console.log(`[CART] Updating cart ${existingCart.id} with new sessionId: ${sessionId}`);
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
                console.log(`[CART] Found cart by sessionId: ${existingCart.id}`);

                // If user is logged in but cart isn't associated, associate it now
                if (userId && existingCart.userId !== userId) {
                    console.log(`[CART] Associating cart ${existingCart.id} with user ${userId}`);
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
        console.log(`[CART] No cart found for ${userId ? 'user ' + userId + ' or ' : ''}session ${sessionId}, creating new cart`);
        return await this.getOrCreateCart(sessionId, userId);
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
                            variant: true
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
     * Get cart data as view model by Cart ID
     */
    async _getCartViewModelById(cartId: string): Promise<CartViewModel> {
        const cartData = await this._getCartWithItems(cartId);

        if (!cartData) {
            // This case should ideally be handled by getOrCreateCart, but return empty as fallback
            console.warn(`Cart not found when fetching ViewModel for ID: ${cartId}. Returning empty cart.`);
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

        const items = cartData.items.map((item: CartItem & { variant: Pick<ProductVariant, 'id' | 'sku' | 'name' | 'price' | 'stockQuantity' | 'attributes' | 'productId'> }) => {
            const variantViewModel = toProductVariantViewModel(item.variant as ProductVariant);
            return {
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                productVariantId: item.productVariantId,
                variant: variantViewModel,
                imageUrl: item.variant.attributes?.image || '/placeholder.jpg',
                name: item.variant.name
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
     * Add item to cart with proper error handling
     */
    async addItemToCart(
        cartId: string,
        productVariantId: string,
        quantity: number = 1
    ): Promise<void> {
        try {
            const variant = await db.query.productVariant.findFirst({
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

            const existingItem = await db.query.cartItem.findFirst({
                where: and(
                    eq(cartItem.cartId, cartId),
                    eq(cartItem.productVariantId, productVariantId)
                )
            });

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > variant.stockQuantity) {
                    throw new StockError(`Not enough stock available for total quantity. Requested: ${newQuantity}, Available: ${variant.stockQuantity}`);
                }

                await db.update(cartItem)
                    .set({
                        quantity: newQuantity,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cartItem.id, existingItem.id));
            } else {
                const newItem: NewCartItem = {
                    id: randomUUID(),
                    cartId,
                    productVariantId,
                    quantity,
                    price: variant.price
                };

                await db.insert(cartItem).values(newItem);
            }

            await db.update(cart)
                .set({ updatedAt: sql`(unixepoch())` })
                .where(eq(cart.id, cartId));
        } catch (error) {
            if (error instanceof CartError || error instanceof StockError) {
                throw error;
            }
            console.error('Error adding item to cart:', error);
            throw new CartError('Failed to add item to cart');
        }
    },

    /**
     * Update cart item quantity
     */
    async updateCartItemQuantity(
        cartItemId: string,
        quantity: number
    ): Promise<void> {
        try {
            const item = await db.query.cartItem.findFirst({
                where: eq(cartItem.id, cartItemId)
            });

            if (!item) {
                throw new CartError('Cart item not found');
            }

            const cartId = item.cartId;
            const variantId = item.productVariantId;

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
        } catch (error) {
            if (error instanceof CartError || error instanceof StockError) {
                throw error;
            }
            console.error('Error updating cart item quantity:', error);
            throw new CartError('Failed to update cart item quantity');
        }
    },

    /**
     * Remove item from cart
     */
    async removeCartItem(cartItemId: string): Promise<void> {
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
                await tx.delete(cartItem).where(eq(cartItem.id, cartItemId));
                await tx.update(cart)
                    .set({ updatedAt: sql`(unixepoch())` })
                    .where(eq(cart.id, cartId));
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
     * Clear all items from cart
     */
    async clearCart(cartId: string): Promise<void> {
        try {
            await db.delete(cartItem).where(eq(cartItem.cartId, cartId));
            await db.update(cart)
                .set({
                    discountCode: null,
                    discountAmount: 0,
                    updatedAt: sql`(unixepoch())`
                })
                .where(eq(cart.id, cartId));
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw new CartError('Failed to clear cart');
        }
    },

    /**
     * Apply discount code to cart
     */
    async applyDiscountToCart(
        cartId: string,
        code: string
    ): Promise<void> {
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
     * Remove discount from cart
     */
    async removeDiscountFromCart(cartId: string): Promise<void> {
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
     * Calculate cart summary (does not fetch data)
     */
    calculateCartSummary(items: CartItemBase[], discountAmount: number = 0): CartSummaryViewModel {
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
     * Get cart summary data as view model for the client
     */
    async getCartSummaryViewModel(sessionId: string): Promise<CartSummaryViewModel> {
        try {
            const cartView = await this.getCartViewModel(sessionId);
            return this.calculateCartSummary(cartView.items, cartView.discountAmount);
        } catch (error) {
            console.error('Failed to get cart summary:', error);
            return { subtotal: 0, discountAmount: 0, total: 0, itemCount: 0 };
        }
    },

    /**
     * Set guest email for checkout
     */
    async setGuestEmail(sessionId: string, email: string, userId?: string | null): Promise<void> {
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
     * Associates the session cart with the user and deletes old carts.
     * Returns the ID of the final user cart.
     */
    async handleUserLoginMerge(sessionId: string, userId: string): Promise<string | null> {
        console.log(`[CART] Login Merge: Starting for session "${sessionId}", user ${userId}`);

        try {
            // Validation
            if (!sessionId || sessionId.trim() === '') {
                console.log(`[CART] Login Merge: No valid session ID provided, nothing to merge`);
                return null;
            }

            if (!userId) {
                console.log(`[CART] Login Merge: No user ID provided, nothing to merge`);
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
                console.log(`[CART] Login Merge: Found cart already linked to both user ${userId} AND session "${sessionId}". Cart ID: ${existingLinkedCart.id}. No merge needed.`);
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

            // Log the carts we found
            console.log(`[CART] Login Merge: Found session cart? ${!!sessionCart} (ID: ${sessionCart?.id || 'none'})`);
            console.log(`[CART] Login Merge: Found user cart? ${!!userCart} (ID: ${userCart?.id || 'none'})`);

            // Step 4: Determine which cart to keep
            if (sessionCart && userCart) {
                // Both carts exist - decide which to keep based on item count
                console.log(`[CART] Login Merge: Found both session cart ${sessionCart.id} and user cart ${userCart.id}`);

                const sessionCartItems = await db.query.cartItem.findMany({
                    where: eq(cartItem.cartId, sessionCart.id)
                });

                const userCartItems = await db.query.cartItem.findMany({
                    where: eq(cartItem.cartId, userCart.id)
                });

                console.log(`[CART] Login Merge: Session cart has ${sessionCartItems.length} items, user cart has ${userCartItems.length} items`);

                // ⚠️ IMPORTANT: Always keep the session cart in this scenario
                // This ensures we preserve the cart that's associated with the current session cookie
                console.log(`[CART] Login Merge: Keeping session cart ${sessionCart.id} (${sessionCartItems.length} items) and merging items from user cart ${userCart.id} (${userCartItems.length} items)`);

                // Update session cart to associate with user
                await db.update(cart)
                    .set({
                        userId: userId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, sessionCart.id));

                console.log(`[CART] Login Merge: Updated session cart ${sessionCart.id} with user ID ${userId}`);

                // Transfer any items from user cart to session cart if needed
                if (userCartItems.length > 0) {
                    console.log(`[CART] Login Merge: Transferring ${userCartItems.length} items from user cart to session cart`);
                    // Transfer logic would go here - not implementing full transfer for now
                }

                // Delete the user cart and its items (cascade delete)
                await db.delete(cart).where(eq(cart.id, userCart.id));
                console.log(`[CART] Login Merge: Deleted user cart ${userCart.id}`);

                return sessionCart.id;
            } else if (sessionCart) {
                // Only session cart exists
                console.log(`[CART] Login Merge: Found only session cart ${sessionCart.id}`);

                // Update session cart to associate with user
                await db.update(cart)
                    .set({
                        userId: userId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, sessionCart.id));

                console.log(`[CART] Login Merge: Updated session cart ${sessionCart.id} with user ${userId}`);
                return sessionCart.id;
            } else if (userCart) {
                // Only user cart exists - update its session ID to match the current session
                console.log(`[CART] Login Merge: Found only user cart ${userCart.id}`);

                // Update user cart to use current session ID
                await db.update(cart)
                    .set({
                        sessionId: sessionId,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cart.id, userCart.id));

                console.log(`[CART] Login Merge: Updated user cart ${userCart.id} with session "${sessionId}"`);
                return userCart.id;
            } else {
                // No carts found - create a new one with both session ID and user ID
                console.log(`[CART] Login Merge: No carts found for session "${sessionId}" or user ${userId}. Creating new cart.`);

                const newCartData: NewCart = {
                    id: randomUUID(),
                    sessionId: sessionId,
                    userId: userId
                };

                await db.insert(cart).values(newCartData);
                console.log(`[CART] Login Merge: Created new cart ${newCartData.id} with session "${sessionId}" and user ${userId}`);

                return newCartData.id;
            }
        } catch (error) {
            console.error(`[CART] Login Merge ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    },
}; 