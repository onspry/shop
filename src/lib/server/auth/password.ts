import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { env } from "$env/dynamic/private";

/**
 * Constant-time comparison of two arrays
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}

/**
 * Hashes a password using PBKDF2 with secure parameters
 *
 * @param password - The password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100_000,
            hash: "SHA-256"
        },
        key,
        256
    );
    const hashArray = new Uint8Array(hash);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);
    return btoa(String.fromCharCode(...combined));
}

/**
 * Verifies a password against a hash
 *
 * @param storedHash - The stored hashed password
 * @param password - The plain text password to verify
 * @returns Promise<boolean> - True if the password matches the hash, false otherwise
 */
export async function verifyPasswordHash(storedHash: string, password: string): Promise<boolean> {
    const combined = new Uint8Array(atob(storedHash).split("").map(c => c.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const storedHashArray = combined.slice(16);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100_000,
            hash: "SHA-256"
        },
        key,
        256
    );
    const hashArray = new Uint8Array(hash);
    return constantTimeEqual(storedHashArray, hashArray);
}

/**
 * Verifies the strength of a password by checking:
 * 1. Length (must be between 8 and 255 characters)
 * 2. If it appears in the Pwned Passwords database (using k-anonymity)
 *
 * @param password - The password to verify
 * @returns Promise<boolean> - True if the password is strong, false otherwise
 */
export async function verifyPasswordStrength(password: string): Promise<boolean> {
    if (password.length < 8 || password.length > 255) {
        return false;
    }
    const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
    const hashPrefix = hash.slice(0, 5);
    const response = await fetch(`${env.PWNED_PASSWORDS_API_URL}/${hashPrefix}`);
    const data = await response.text();
    const items = data.split("\n");
    for (const item of items) {
        const hashSuffix = item.slice(0, 35).toLowerCase();
        if (hash === hashPrefix + hashSuffix) {
            return false;
        }
    }
    return true;
}