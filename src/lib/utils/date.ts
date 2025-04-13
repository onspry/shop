/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Format a date string or Date object to a localized date and time string
 * @param dateInput - Date string or Date object to format
 * @param locale - Locale to use for formatting (defaults to browser locale)
 * @returns Formatted date and time string
 */
export function formatDateTime(dateInput: string | Date, locale?: string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date string or Date object to a localized date string (without time)
 * @param dateInput - Date string or Date object to format
 * @param locale - Locale to use for formatting (defaults to browser locale)
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | Date, locale?: string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate and format an estimated delivery date
 * @param dateInput - Starting date string or Date object
 * @param daysToAdd - Number of days to add for delivery estimate
 * @param locale - Locale to use for formatting (defaults to browser locale)
 * @returns Formatted estimated delivery date
 */
export function formatEstimatedDelivery(
  dateInput: string | Date, 
  daysToAdd: number = 7,
  locale?: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const deliveryDate = new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  
  return formatDate(deliveryDate, locale);
}

/**
 * Format a credit card number to show only the last 4 digits
 * @param cardNumber - Full or partial card number
 * @returns Formatted card number with only last 4 digits visible
 */
export function formatCreditCardNumber(cardNumber: string): string {
  // Remove any spaces or non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // If we have at least 4 digits, mask all but the last 4
  if (cleanNumber.length >= 4) {
    const lastFour = cleanNumber.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  }
  
  // If we have less than 4 digits, return a generic masked number
  return '•••• •••• •••• ••••';
}
