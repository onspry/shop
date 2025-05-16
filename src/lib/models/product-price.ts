import type { Locale } from '$lib/utils/localization';
import { formatPrice } from '$lib/utils/price';

/**
 * Type definition for supported currencies
 */
export type SupportedCurrency = 'EUR' | 'GBP' | 'CNY' | 'USD';

/**
 * Maps locale to currency
 */
export const localeToCurrency: Record<string, SupportedCurrency> = {
    'en-US': 'USD',
    'en-UK': 'GBP',
    'de-DE': 'EUR',
    'fr-FR': 'EUR',
    'zh-CN': 'CNY'
};

/**
 * Currency symbols for display
 */
export const currencySymbols: Record<SupportedCurrency, string> = {
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'USD': '$'
};

/**
 * Default currency to use if none specified
 */
export const DEFAULT_CURRENCY: SupportedCurrency = 'EUR';

/**
 * Get the currency code for a given locale
 */
export function getCurrencyForLocale(locale: Locale): SupportedCurrency {
    return localeToCurrency[locale] || DEFAULT_CURRENCY;
}

/**
 * Get price from a prices object based on locale 
 */
export function getPriceForLocale(
    prices: Record<string, number> | unknown,
    locale: Locale,
    basePrice: number = 0
): number {
    // Get appropriate currency for this locale
    const currency = getCurrencyForLocale(locale);

    // Parse prices JSON safely
    let pricesByCurrency: Record<string, number> = {};
    try {
        pricesByCurrency = typeof prices === 'object' && prices !== null
            ? prices as Record<string, number>
            : {};
    } catch (e) {
        console.error('Error parsing prices JSON:', e);
    }

    // Return localized price or fall back to base price
    return pricesByCurrency[currency] || basePrice;
}

// Re-export formatPrice from utils/price for backward compatibility
export { formatPrice }; 