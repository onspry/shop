/**
 * Represents a value that can be localized across different languages
 * - string: For simple text values
 * - string[]: For arrays of text (e.g., features list)
 * - Record<string, unknown>: For complex objects with localized fields
 */
export type LocalizedValue = string | string[] | Record<string, unknown>;

/**
 * Represents a record of localized values for different languages
 * The key is the language code (e.g., 'en', 'de', 'fr', 'cn')
 * The value is the localized content
 */
export type LocalizedRecord<T extends LocalizedValue> = Record<string, T>; 