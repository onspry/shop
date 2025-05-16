import { getCurrencyForLocale, DEFAULT_CURRENCY } from '$lib/models/product-price';
import type { Locale } from '$lib/utils/localization';

/**
 * Formats a price from cents to a localized currency string
 * @param price - Price in cents (integer)
 * @param locale - Locale for formatting (defaults to 'en-US')
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(
    price: number,
    locale: Locale = 'en-US'
): string {
    // Get currency based on locale
    const currency = getCurrencyForLocale(locale) || DEFAULT_CURRENCY;

    // Format the price with the correct locale and currency
    const dollars = price / 100;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(dollars);
}

/**
 * Converts a price from dollars to cents
 * @param price - Price in dollars (float)
 * @returns Price in cents (integer)
 */
export function toCents(price: number): number {
    return Math.round(price * 100);
}

/**
 * Converts a price from cents to dollars
 * @param price - Price in cents (integer)
 * @returns Price in dollars (float)
 */
export function toDollars(price: number): number {
    return price / 100;
}

/**
 * Calculates the total price from an array of prices in cents
 * @param prices - Array of prices in cents
 * @returns Total price in cents
 */
export function calculateTotal(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0);
}
