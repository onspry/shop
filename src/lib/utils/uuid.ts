/**
 * Generates a UUID v4 using the Web Crypto API
 * Compatible with both browser and Cloudflare Workers environments
 */
export function generateUUID(): string {
  // Use the Web Crypto API which is available in browsers and Cloudflare Workers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation if randomUUID is not available
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Set version (4) and variant (8, 9, A, or B)
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  
  // Convert to hex string
  return [
    bytes.slice(0, 4).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''),
    bytes.slice(4, 6).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''),
    bytes.slice(6, 8).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''),
    bytes.slice(8, 10).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), ''),
    bytes.slice(10).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
  ].join('-');
}