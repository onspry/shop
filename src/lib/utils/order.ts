/**
 * Utility functions for order-related operations
 */

/**
 * Formats a UUID into a user-friendly order number
 * Format: ON-YYYYMMDD-XXXX where XXXX is the first 4 characters of the UUID
 * 
 * @param id - The UUID to format
 * @param date - Optional date to use (defaults to current date)
 * @returns A formatted order number string
 */
export function formatOrderNumber(id: string, date?: string | Date): string {
    // Use provided date or current date
    const orderDate = date ? new Date(date) : new Date();
    
    // Format date as YYYYMMDD
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const day = String(orderDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get first 4 characters of the UUID (without dashes)
    const shortId = id.replace(/-/g, '').substring(0, 4).toUpperCase();
    
    // Combine into final format
    return `ON-${dateStr}-${shortId}`;
}
