import { eq, and, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { cart, type NewCart, type Cart } from '$lib/server/db/schema/cart';
import { cartItem, type NewCartItem, type CartItem } from '$lib/server/db/schema/cart_item';
import { productVariant, type ProductVariant } from '$lib/server/db/schema/product_variant';
import { discount } from '$lib/server/db/schema/discount';
import { nanoid } from 'nanoid';
import type { CartViewModel, CartSummaryViewModel } from '$lib/models/cart';

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

/**
 * Get a cart by session ID or create a new one
 */
export async function getOrCreateCart(sessionId: string, userId?: string): Promise<Cart> {
    // First try to find by session
    let existingCart = await db.query.cart.findFirst({
        where: eq(cart.sessionId, sessionId)
    });

    // If no cart found, create a new one
    if (!existingCart) {
        const newCart: NewCart = {
            id: nanoid(),
            sessionId,
            userId: userId || null
        };

        await db.insert(cart).values(newCart);

        existingCart = await db.query.cart.findFirst({
            where: eq(cart.id, newCart.id)
        });

        if (!existingCart) {
            throw new Error('Failed to create cart');
        }
    }

    return existingCart;
}

/**
 * Get cart with items and related product data
 */
export async function getCartWithItems(cartId: string): Promise<CartWithItems | null> {
    try {
        // Get cart
        const cartData = await db.query.cart.findFirst({
            where: eq(cart.id, cartId)
        });

        if (!cartData) {
            return null;
        }

        // Get cart items
        const items = await db.select()
            .from(cartItem)
            .where(eq(cartItem.cartId, cartId));

        // Get variants for all items
        const itemsWithVariants = await Promise.all(
            items.map(async (item) => {
                const variant = await db.select({
                    id: productVariant.id,
                    sku: productVariant.sku,
                    name: productVariant.name,
                    price: productVariant.price,
                    stockQuantity: productVariant.stockQuantity,
                    attributes: productVariant.attributes,
                    productId: productVariant.productId,
                })
                    .from(productVariant)
                    .where(eq(productVariant.id, item.productVariantId))
                    .then(rows => rows[0] || null);

                return {
                    ...item,
                    variant
                };
            })
        );

        return {
            ...cartData,
            items: itemsWithVariants.filter(item => item.variant !== null)
        } as CartWithItems;
    } catch (error) {
        console.error('Error fetching cart with items:', error);
        return null;
    }
}

/**
 * Add item to cart with proper error handling
 */
export async function addItemToCart(
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
                id: nanoid(),
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
        if (error instanceof CartError) {
            throw error;
        }
        console.error('Error adding item to cart:', error);
        throw new CartError('Failed to add item to cart');
    }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
    cartItemId: string,
    quantity: number
): Promise<void> {
    try {
        // Get the cart item
        const item = await db.query.cartItem.findFirst({
            where: eq(cartItem.id, cartItemId)
        });

        if (!item) {
            throw new Error('Cart item not found');
        }

        const cartId = item.cartId;
        const variantId = item.productVariantId;

        if (quantity <= 0) {
            // Use transaction to perform multiple operations atomically and reduce roundtrips
            await db.transaction(async (tx) => {
                // Remove item if quantity is zero or negative
                await tx.delete(cartItem).where(eq(cartItem.id, cartItemId));

                // Update cart timestamp in the same transaction
                await tx.update(cart)
                    .set({ updatedAt: sql`(unixepoch())` })
                    .where(eq(cart.id, cartId));
            });
        } else {
            // Get product variant to check stock
            const variant = await db.query.productVariant.findFirst({
                where: eq(productVariant.id, variantId)
            });

            if (!variant) {
                throw new Error('Product variant not found');
            }

            // Check stock availability
            if (variant.stockQuantity !== undefined && quantity > variant.stockQuantity) {
                throw new Error('Not enough stock available');
            }

            // Use transaction to perform multiple operations atomically and reduce roundtrips
            await db.transaction(async (tx) => {
                // Update the quantity
                await tx.update(cartItem)
                    .set({
                        quantity,
                        updatedAt: sql`(unixepoch())`
                    })
                    .where(eq(cartItem.id, cartItemId));

                // Update cart timestamp in the same transaction
                await tx.update(cart)
                    .set({ updatedAt: sql`(unixepoch())` })
                    .where(eq(cart.id, cartId));
            });
        }
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        throw error;
    }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(cartItemId: string): Promise<void> {
    try {
        // Get cart ID for this item
        const item = await db.query.cartItem.findFirst({
            where: eq(cartItem.id, cartItemId),
            columns: {
                cartId: true
            }
        });

        if (!item) {
            throw new Error('Cart item not found');
        }

        const cartId = item.cartId;

        // Use a transaction to perform both operations atomically
        await db.transaction(async (tx) => {
            // Remove the item
            await tx.delete(cartItem).where(eq(cartItem.id, cartItemId));

            // Update cart timestamp
            await tx.update(cart)
                .set({ updatedAt: sql`(unixepoch())` })
                .where(eq(cart.id, cartId));
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        throw error;
    }
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<void> {
    // Remove all items
    await db.delete(cartItem).where(eq(cartItem.cartId, cartId));

    // Update cart with empty discount and timestamp
    await db.update(cart)
        .set({
            discountCode: null,
            discountAmount: 0,
            updatedAt: sql`(unixepoch())`
        })
        .where(eq(cart.id, cartId));
}

/**
 * Apply discount code to cart
 */
export async function applyDiscountToCart(
    cartId: string,
    code: string
): Promise<void> {
    // Find valid discount code
    const discountCode = await db.query.discount.findFirst({
        where: and(
            eq(discount.code, code),
            eq(discount.active, true),
        )
    });

    if (!discountCode) {
        throw new Error('Invalid discount code');
    }

    // Check if code is expired
    const now = Math.floor(Date.now() / 1000);
    if (discountCode.validUntil && typeof discountCode.validUntil === 'number' && discountCode.validUntil < now) {
        throw new Error('Discount code has expired');
    }

    // Check if max uses is reached
    if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
        throw new Error('Discount code has reached maximum usage');
    }

    // Calculate cart total to check min spend requirement
    const cartWithItems = await getCartWithItems(cartId);

    // Type guards to ensure cart and items exist
    if (!cartWithItems || !cartWithItems.items || !Array.isArray(cartWithItems.items)) {
        throw new Error('Cart is empty');
    }

    if (cartWithItems.items.length === 0) {
        throw new Error('Cart is empty');
    }

    const cartTotal = cartWithItems.items.reduce(
        (sum: number, item) => {
            if (item && item.price && item.quantity) {
                return sum + (item.price * item.quantity);
            }
            return sum;
        },
        0
    );

    // Check minimum spend requirement
    if (discountCode.minSpend && cartTotal < discountCode.minSpend) {
        throw new Error(`Minimum spend of ${discountCode.minSpend / 100} required`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
        discountAmount = Math.round(cartTotal * (discountCode.value / 100));
    } else if (discountCode.type === 'fixed') {
        discountAmount = Math.min(cartTotal, discountCode.value);
    } else if (discountCode.type === 'shipping') {
        discountAmount = discountCode.value;
    }

    // Apply discount to cart
    await db.update(cart)
        .set({
            discountCode: code,
            discountAmount,
            updatedAt: sql`(unixepoch())`
        })
        .where(eq(cart.id, cartId));

    // Increment usage counter for the discount code
    await db.update(discount)
        .set({
            usedCount: discountCode.usedCount + 1,
            updatedAt: sql`(unixepoch())`
        })
        .where(eq(discount.id, discountCode.id));
}

/**
 * Remove discount from cart
 */
export async function removeDiscountFromCart(cartId: string): Promise<void> {
    await db.update(cart)
        .set({
            discountCode: null,
            discountAmount: 0,
            updatedAt: sql`(unixepoch())`
        })
        .where(eq(cart.id, cartId));
}

/**
 * Calculate cart summary
 */
export function calculateCartSummary(items: CartItemBase[]): CartSummaryViewModel {
    if (!items || items.length === 0) {
        return {
            subtotal: 0,
            discountAmount: 0,
            total: 0,
            itemCount: 0
        };
    }

    const summary = items.reduce(
        (acc, item) => ({
            subtotal: acc.subtotal + (item.price * item.quantity),
            itemCount: acc.itemCount + item.quantity,
            discountAmount: 0,
            total: acc.total + (item.price * item.quantity)
        }),
        { subtotal: 0, itemCount: 0, discountAmount: 0, total: 0 }
    );

    return summary;
}

/**
 * Link cart to user after login/signup
 */
export async function assignCartToUser(
    sessionId: string,
    userId: string
): Promise<void> {
    const userCart = await db.query.cart.findFirst({
        where: eq(cart.userId, userId)
    });

    const sessionCart = await db.query.cart.findFirst({
        where: eq(cart.sessionId, sessionId)
    });

    if (!sessionCart) {
        // If no session cart exists, create one for the user
        if (!userCart) {
            await db.insert(cart).values({
                id: nanoid(),
                userId,
                sessionId
            });
        }
        return;
    }

    if (userCart) {
        // User already has a cart - merge items from session cart
        const sessionItems = await db.query.cartItem.findMany({
            where: eq(cartItem.cartId, sessionCart.id)
        });

        // Move each item one by one (handling duplicates)
        for (const item of sessionItems) {
            try {
                await addItemToCart(
                    userCart.id,
                    item.productVariantId,
                    item.quantity
                );
            } catch (error) {
                console.error('Error merging cart item:', error);
                // Continue with other items even if one fails
            }
        }

        // Apply discount if session cart has one and user cart doesn't
        if (sessionCart.discountCode && !userCart.discountCode) {
            try {
                await applyDiscountToCart(userCart.id, sessionCart.discountCode);
            } catch (error) {
                console.error('Error applying discount to merged cart:', error);
            }
        }

        // Delete the session cart
        await db.delete(cart).where(eq(cart.id, sessionCart.id));
    } else {
        // User doesn't have a cart - assign session cart to user
        await db.update(cart)
            .set({
                userId,
                updatedAt: sql`(unixepoch())`
            })
            .where(eq(cart.id, sessionCart.id));
    }
}

/**
 * Get cart data as view model for the client
 */
export async function getCartViewModel(sessionId: string, userId?: string): Promise<CartViewModel> {
    const cart = await getOrCreateCart(sessionId, userId);

    if (!cart) {
        return {
            id: '',
            items: [],
            discountCode: null,
            discountAmount: 0,
            subtotal: 0,
            total: 0,
            itemCount: 0
        };
    }

    const cartWithItems = await getCartWithItems(cart.id) as CartWithItems | null;
    const items = cartWithItems?.items || [];
    const summary = calculateCartSummary(items.map(item => ({
        price: item.price,
        quantity: item.quantity
    })));

    return {
        id: cart.id,
        items: items
            .filter(item => item.variant)
            .map(item => ({
                id: item.id,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                price: item.price,
                variant: {
                    id: item.variant.id,
                    sku: item.variant.sku,
                    name: item.variant.name,
                    price: item.variant.price,
                    stock_quantity: item.variant.stockQuantity,
                    attributes: item.variant.attributes || {},
                    stockStatus: getStockStatus(item.variant.stockQuantity)
                },
                imageUrl: item.variant.attributes?.image || '',
                name: item.variant.name,
                product: {
                    id: item.variant.productId,
                    name: item.variant.name.split(' - ')[0],
                    slug: '',
                    description: null
                }
            })),
        discountCode: cart.discountCode,
        discountAmount: cart.discountAmount || 0,
        subtotal: summary.subtotal,
        total: summary.total,
        itemCount: summary.itemCount
    };
}

function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    return 'in_stock';
}

/**
 * Get cart summary data as view model for the client
 */
export async function getCartSummaryViewModel(sessionId: string, userId?: string): Promise<CartSummaryViewModel> {
    try {
        const userCart = await getOrCreateCart(sessionId, userId);
        if (!userCart) {
            return {
                subtotal: 0,
                discountAmount: 0,
                total: 0,
                itemCount: 0
            };
        }

        const cartWithItems = await getCartWithItems(userCart.id);
        const items = cartWithItems?.items || [];

        return calculateCartSummary(items.map(item => ({
            price: item.price,
            quantity: item.quantity
        })));
    } catch (error) {
        console.error('Failed to get cart summary:', error);
        return {
            subtotal: 0,
            discountAmount: 0,
            total: 0,
            itemCount: 0
        };
    }
}

/**
 * Transfer cart from session to user after login
 */
export async function transferCartToUser(sessionId: string, userId: string): Promise<void> {
    try {
        // Check if session exists and has a cart
        const sessionCart = await db.query.cart.findFirst({
            where: eq(cart.sessionId, sessionId)
        });

        if (!sessionCart) {
            return; // No session cart, nothing to transfer
        }

        // Check if user already has a cart
        const userCart = await db.query.cart.findFirst({
            where: eq(cart.userId, userId)
        });

        if (!userCart) {
            // If user doesn't have a cart, just assign the session cart to the user
            await db.update(cart)
                .set({
                    userId,
                    updatedAt: sql`(unixepoch())`
                })
                .where(eq(cart.id, sessionCart.id));
            return;
        }

        // User already has a cart, merge the items
        const sessionItems = await db.query.cartItem.findMany({
            where: eq(cartItem.cartId, sessionCart.id)
        });

        // Transfer each item to the user's cart
        for (const item of sessionItems) {
            await addItemToCart(
                userCart.id,
                item.productVariantId,
                item.quantity
            );
        }

        // If session cart had a discount, apply it to user's cart
        if (sessionCart.discountCode) {
            try {
                await applyDiscountToCart(userCart.id, sessionCart.discountCode);
            } catch (error) {
                console.error('Could not transfer discount code:', error);
            }
        }

        // Delete the session cart after transfer
        await clearCart(sessionCart.id);
        await db.delete(cart).where(eq(cart.id, sessionCart.id));

    } catch (error) {
        console.error('Error transferring cart to user:', error);
        throw error;
    }
}

/**
 * Set guest email for checkout
 */
export async function setGuestEmail(sessionId: string, email: string): Promise<void> {
    try {
        const userCart = await db.query.cart.findFirst({
            where: eq(cart.sessionId, sessionId)
        });

        if (!userCart) {
            throw new Error('Cart not found');
        }

        await db.update(cart)
            .set({
                guestEmail: email,
                updatedAt: sql`(unixepoch())`
            })
            .where(eq(cart.id, userCart.id));
    } catch (error) {
        console.error('Error setting guest email:', error);
        throw error;
    }
} 