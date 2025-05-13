import type { LocalizedValue } from '$lib/types/localization';

/**
 * Available locales in the application
 */
export const AVAILABLE_LOCALES = ['en', 'de', 'fr', 'cn'] as const;
export type Locale = (typeof AVAILABLE_LOCALES)[number];

/**
 * Gets a localized value from a multilingual object
 * @param obj - The object containing localized values
 * @param locale - The target locale
 * @param fallback - The fallback locale (defaults to 'en')
 * @returns The localized value or a default based on the value type
 */
export function getLocalizedValue(
    obj: Record<string, LocalizedValue> | null | undefined,
    locale: Locale,
    fallback: Locale = 'en'
): LocalizedValue {
    if (!obj) {
        return Array.isArray(obj) ? [] : (typeof obj === 'object' ? {} : '');
    }

    return obj[locale] || obj[fallback] || (Array.isArray(obj) ? [] : (typeof obj === 'object' ? {} : ''));
}

/**
 * Creates a localized record with the same value for all locales
 * @param value - The value to use for all locales
 * @returns A record with the value mapped to all available locales
 */
export function createLocalizedRecord<T extends LocalizedValue>(value: T): Record<Locale, T> {
    return AVAILABLE_LOCALES.reduce((acc, locale) => {
        acc[locale] = value;
        return acc;
    }, {} as Record<Locale, T>);
}

/**
 * Validates if a string is a valid locale
 * @param locale - The locale to validate
 * @returns True if the locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
    return AVAILABLE_LOCALES.includes(locale as Locale);
} 