import { eq, and, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { cart, type NewCart, type Cart } from '$lib/server/db/schema/cart';
import { cartItem, type NewCartItem, type CartItem } from '$lib/server/db/schema/cart_item';
import { productVariant, type ProductVariant } from '$lib/server/db/schema/product_variant';
import { discount } from '$lib/server/db/schema/discount';
import { nanoid } from 'nanoid';

// Define type for cart with items to avoid 'any'
export type CartWithItems = Cart & {
    items: (CartItem & {
        productVariant: ProductVariant;
    })[];
};

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
export async function getCartWithItems(cartId: string) {
    try {
        // First get the cart
        const cartData = await db.query.cart.findFirst({
            where: eq(cart.id, cartId)
        });

        if (!cartData) {
            return null;
        }

        // Then get cart items
        const items = await db.query.cartItem.findMany({
            where: eq(cartItem.cartId, cartId)
        });

        // Get product variants for all items
        const itemsWithVariants = await Promise.all(
            items.map(async (item) => {
                const variant = await db.query.productVariant.findFirst({
                    where: eq(productVariant.id, item.productVariantId)
                });
                return {
                    ...item,
                    productVariant: variant
                };
            })
        );

        // Return cart with items
        return {
            ...cartData,
            items: itemsWithVariants
        };
    } catch (error) {
        console.error('Error fetching cart with items:', error);
        return null;
    }
}

/**
 * Add item to cart
 */
export async function addItemToCart(
    cartId: string,
    productVariantId: string,
    quantity: number = 1
): Promise<void> {
    // Check if product variant exists and get its price
    const variant = await db.query.productVariant.findFirst({
        where: eq(productVariant.id, productVariantId),
        columns: {
            id: true,
            price: true,
            stockQuantity: true
        }
    });

    if (!variant) {
        throw new Error('Product variant not found');
    }

    if (variant.stockQuantity < quantity) {
        throw new Error('Not enough stock available');
    }

    // Check if item already exists in cart
    const existingItem = await db.query.cartItem.findFirst({
        where: and(
            eq(cartItem.cartId, cartId),
            eq(cartItem.productVariantId, productVariantId)
        )
    });

    if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > variant.stockQuantity) {
            throw new Error('Not enough stock available');
        }

        await db.update(cartItem)
            .set({
                quantity: newQuantity,
                updatedAt: sql`(unixepoch())`
            })
            .where(eq(cartItem.id, existingItem.id));
    } else {
        // Add new item to cart
        const newItem: NewCartItem = {
            id: nanoid(),
            cartId,
            productVariantId,
            quantity,
            price: variant.price
        };

        await db.insert(cartItem).values(newItem);
    }

    // Update cart timestamp
    await db.update(cart)
        .set({ updatedAt: sql`(unixepoch())` })
        .where(eq(cart.id, cartId));
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
export function calculateCartSummary(cartWithItems: CartWithItems | null) {
    // Type guards to ensure cart and items exist
    if (!cartWithItems || !cartWithItems.items) {
        return {
            subtotal: 0,
            discount: 0,
            total: 0,
            itemCount: 0
        };
    }

    const items = cartWithItems.items as unknown as CartItem[];
    if (items.length === 0) {
        return {
            subtotal: 0,
            discount: 0,
            total: 0,
            itemCount: 0
        };
    }

    const subtotal = items.reduce(
        (sum: number, item: CartItem) => sum + (item.price * item.quantity),
        0
    );

    const discount = cartWithItems.discountAmount || 0;
    const total = Math.max(0, subtotal - discount);
    const itemCount = items.reduce(
        (count: number, item: CartItem) => count + item.quantity,
        0
    );

    return {
        subtotal,
        discount,
        total,
        itemCount,
        discountCode: cartWithItems.discountCode
    };
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