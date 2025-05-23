import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { emailSchema } from '$lib/schemas/auth';
import { shippingSchema } from '$lib/schemas/shipping';
import { paymentSchema } from '$lib/schemas/payment';
import { OrderRepository, isValidOrderItem, mapCartItemToOrderItem } from '$lib/repositories/order-repository';
import type { CreateOrderViewModel, OrderItemViewModel } from '$lib/models/order'; // Import the correct type
import { cartRepository } from '$lib/repositories/cart-repository';
import type { CartItemViewModel } from '$lib/models/cart';


// Helper function to validate and transform cart items for the client
function validateAndTransformCartItems(cart: { items: CartItemViewModel[] }) {
    console.log('Validating cart items:', cart.items.length);
    const mappedItems = cart.items.map(item => mapCartItemToOrderItem(item));
    console.log('Mapped items:', mappedItems.length);
    const validItems = mappedItems.filter(item => isValidOrderItem(item));
    console.log('Valid items:', validItems.length);
    return validItems;
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
    // Get session or user ID
    const sessionId = cookies.get('cart-session') || '';
    const userId = locals.user?.id;

    if (!sessionId && !userId) {
        // No session or user, redirect to cart
        throw redirect(303, '/cart');
    }

    try {
        // Get cart data using repository pattern
        const cartData = await cartRepository.getCartViewModel(sessionId, userId);

        // If cart is empty, redirect to cart
        if (!cartData.items.length) {
            throw redirect(303, '/cart');
        }

        // Validate and transform cart items for the client
        const validOrderItems = validateAndTransformCartItems(cartData);

        // Create forms for non-authenticated users
        const emailForm = await superValidate(zod(emailSchema));
        const shippingForm = await superValidate(zod(shippingSchema));
        const paymentForm = await superValidate(zod(paymentSchema));

        return {
            cart: cartData,
            validOrderItems,
            emailForm,
            shippingForm,
            paymentForm
        };
    } catch (error) {
        console.error('Error loading checkout data:', error);
        throw redirect(303, '/cart?error=checkout');
    }
};

export const actions = {
    placeOrder: async ({ request, locals, cookies }) => {
        console.log('placeOrder action started');
        const formData = await request.formData();

        // Get session ID for debugging
        const sessionId = cookies.get('cart-session') || '';
        console.log('Session ID:', sessionId);
        console.log('User ID:', locals.user?.id);

        try {
            console.log('Processing order submission...');
            // Extract order data from form
            const email = formData.get('email')?.toString();
            const firstName = formData.get('firstName')?.toString();
            const lastName = formData.get('lastName')?.toString();
            const addressLine1 = formData.get('addressLine1')?.toString();
            const addressLine2 = formData.get('addressLine2')?.toString();
            const city = formData.get('city')?.toString();
            const state = formData.get('state')?.toString() || ''; // Default to empty string if not provided
            const postalCode = formData.get('postalCode')?.toString();
            const country = formData.get('country')?.toString();
            const shippingMethod = formData.get('shippingMethod')?.toString();
            const shippingCost = parseFloat(formData.get('shippingCost')?.toString() || '0');
            const cartId = formData.get('cartId')?.toString() || 'guest-cart';
            const subtotal = parseFloat(formData.get('subtotal')?.toString() || '0');
            const taxAmount = parseFloat(formData.get('taxAmount')?.toString() || '0');
            const discountAmount = parseFloat(formData.get('discountAmount')?.toString() || '0');
            const itemsJson = formData.get('items')?.toString();

            // Log form data for debugging
            console.log('Form data received:', {
                email, firstName, lastName, addressLine1, city, state, postalCode, country,
                shippingMethod, shippingCost, cartId, subtotal, taxAmount, discountAmount,
                itemsJson: itemsJson ? `${itemsJson.substring(0, 100)}...` : undefined
            });

            // Validate required fields - note that state might be optional for some countries
            if (!email || !firstName || !lastName || !addressLine1 || !city || !postalCode || !country || !shippingMethod || !itemsJson) {
                console.error('Missing required data:', { email, firstName, lastName, addressLine1, city, postalCode, country, shippingMethod, itemsJson: !!itemsJson });
                return { success: false, error: 'Missing required data' };
            }

            // Validate postal code against country-specific pattern
            try {
                // Import the shipping schema creator
                const { createShippingSchema } = await import('$lib/schemas/shipping');

                // Create a schema for the selected country
                const countrySchema = createShippingSchema(country);

                // Parse and validate just the postal code
                const result = countrySchema.safeParse({
                    firstName, lastName, addressLine1, city, postalCode, country, shippingMethod
                });

                // If validation fails, check if it's because of the postal code
                if (!result.success) {
                    const formattedErrors = result.error.format();
                    if (formattedErrors.postalCode?._errors?.length) {
                        return {
                            success: false,
                            error: 'Invalid postal code',
                            message: formattedErrors.postalCode._errors[0]
                        };
                    }
                }
            } catch (error) {
                console.error('Error validating postal code:', error);
                // Continue with order creation even if validation fails
                // This is a fallback in case the validation code itself has an error
            }

            // State is already handled with a default empty string

            // Parse items with proper typing
            let items: OrderItemViewModel[] = [];
            try {
                items = JSON.parse(itemsJson) as OrderItemViewModel[];
                // Validate that we have at least one valid item
                if (!items || items.length === 0) {
                    return { success: false, error: 'No valid items in cart' };
                }
            } catch (e) {
                console.error('Error parsing items JSON:', e);
                return { success: false, error: 'Invalid items data' };
            }

            // Create order data with proper typing
            const orderData: CreateOrderViewModel = {
                userId: locals.user?.id,
                cartId,
                items, // Use the items directly since they're already in the correct format
                shipping: {
                    method: shippingMethod,
                    amount: shippingCost,
                    address: {
                        firstName,
                        lastName,
                        address1: addressLine1,
                        address2: addressLine2 || undefined,
                        city,
                        state,
                        postalCode,
                        country,
                        email
                    }
                },
                payment: {
                    method: 'credit_card',
                    // In a real implementation, this would be a payment intent ID from Stripe or similar
                    intentId: `mock-payment-${Date.now()}`
                },
                subtotal,
                taxAmount,
                discountAmount,
                currency: 'USD'
            };

            // Create order
            try {
                console.log('Creating order with repository...');
                const orderRepository = new OrderRepository();
                const order = await orderRepository.createOrder(orderData);

                // Log the created order
                console.log('Created order:', order);
                console.log('Order ID:', order.id);

                // Clear cart after successful order creation
                console.log('Clearing cart...');
                await cartRepository.clearCart(cartId);

                // Store the order ID for redirection after the try/catch block
                const orderId = order.id;
                return { success: true, orderId };
            } catch (orderError) {
                console.error('Error in order creation:', orderError);
                return {
                    success: false,
                    orderId: '',
                    error: orderError instanceof Error ? orderError.message : 'Error creating order',
                    message: 'There was a problem processing your order. Please try again.'
                };
            }
        } catch (error) {
            console.error('Error creating order:', error);
            // Provide a more descriptive error message
            const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
            console.error('Order creation error details:', errorMessage);

            // Return just the error data
            // SvelteKit will automatically wrap it in a response object
            return {
                success: false,
                orderId: '',
                error: errorMessage,
                message: 'There was a problem processing your order. Please try again.'
            };
        }
    }
};
