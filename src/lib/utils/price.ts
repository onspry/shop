/**
 * Formats a price from cents to a localized currency string
 * @param price - Price in cents (integer)
 * @param locale - Locale for formatting (defaults to 'en-US')
 * @param currency - Currency code (defaults to 'USD')
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(
    price: number,
    locale: string = 'en-US',
    currency: string = 'USD'
): string {
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

/**
 * Formats a price range (min and max prices)
 * @param minPrice - Minimum price in cents
 * @param maxPrice - Maximum price in cents
 * @param locale - Locale for formatting (defaults to 'en-US')
 * @param currency - Currency code (defaults to 'USD')
 * @returns Formatted price range string
 */
export function formatPriceRange(
    minPrice: number,
    maxPrice: number,
    locale: string = 'en-US',
    currency: string = 'USD'
): string {
    return `${formatPrice(minPrice, locale, currency)} - ${formatPrice(maxPrice, locale, currency)}`;
} 