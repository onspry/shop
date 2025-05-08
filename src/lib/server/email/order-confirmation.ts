import { readFileSync } from 'fs';
import { join } from 'path';
import { sendEmail } from './send-email';
import type { OrderViewModel } from '$lib/models/order';

const templatePath = join(process.cwd(), 'src/lib/server/email/templates/order-confirmation.html');

function validateShippingAddress(address: OrderViewModel['shippingAddress']): void {
    if (!address) {
        throw new Error('Shipping address is required');
    }

    const requiredFields = [
        { field: 'firstName', value: address.firstName },
        { field: 'lastName', value: address.lastName },
        { field: 'address1', value: address.address1 },
        { field: 'city', value: address.city },
        { field: 'postalCode', value: address.postalCode },
        { field: 'country', value: address.country },
        { field: 'email', value: address.email }
    ];

    for (const { field, value } of requiredFields) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new Error(`Shipping address ${field} is required`);
        }
    }

    // State is optional, but if provided must be a string
    if (address.state !== undefined && address.state !== null && typeof address.state !== 'string') {
        throw new Error('Shipping address state must be a string if provided');
    }
}

export async function sendOrderConfirmationEmail(order: OrderViewModel): Promise<void> {
    try {
        // Validate shipping address
        validateShippingAddress(order.shippingAddress);

        // Read the email template
        const template = readFileSync(templatePath, 'utf-8');

        // Format the order items
        const orderItemsHtml = order.items.map(item => `
            <div class="order-item">
                <p><strong>${item.name}</strong> - ${item.variantName}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: $${item.unitPrice.toFixed(2)}</p>
                <p>Total: $${item.totalPrice.toFixed(2)}</p>
            </div>
        `).join('');

        // Format the discount amount if present
        const discountAmountHtml = order.discountAmount ?
            `<p><strong>Discount:</strong> -$${order.discountAmount.toFixed(2)}</p>` : '';

        // Format the shipping address with validation
        const shippingAddressHtml = `
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.address1}<br>
            ${order.shippingAddress.address2 ? `${order.shippingAddress.address2}<br>` : ''}
            ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} ${order.shippingAddress.postalCode}<br>
            ${order.shippingAddress.country}
        `.trim();

        // Replace template placeholders
        const emailContent = template
            .replace('{customerName}', `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`)
            .replace('{orderNumber}', order.orderNumber)
            .replace('{orderDate}', new Date(order.createdAt).toLocaleDateString())
            .replace('{orderItems}', orderItemsHtml)
            .replace('{subtotal}', order.subtotal.toFixed(2))
            .replace('{shippingAmount}', order.shippingAmount.toFixed(2))
            .replace('{taxAmount}', order.taxAmount.toFixed(2))
            .replace('{discountAmount}', discountAmountHtml)
            .replace('{total}', order.total.toFixed(2))
            .replace('{shippingAddress}', shippingAddressHtml)
            .replace('{orderTrackingUrl}', `/orders/${order.id}`)
            .replace('{currentYear}', new Date().getFullYear().toString());

        // Send the email
        await sendEmail(
            order.shippingAddress.email,
            `Order Confirmation - ${order.orderNumber}`,
            emailContent,
            {
                from: 'noreply',
                attachments: [
                    {
                        filename: 'logo-light.svg',
                        path: join(process.cwd(), 'static', 'logo-light.svg'),
                        cid: 'logo-light'
                    },
                    {
                        filename: 'logo-dark.svg',
                        path: join(process.cwd(), 'static', 'logo-dark.svg'),
                        cid: 'logo-dark'
                    }
                ]
            }
        );
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        throw new Error('Failed to send order confirmation email');
    }
} 