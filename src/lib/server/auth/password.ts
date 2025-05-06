import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { env } from "$env/dynamic/private";
import argon2 from "@phc/argon2";

/**
 * Hashes a password using Argon2id with secure parameters
 *
 * @param password - The password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
        variant: 'id'
    });
}

/**
 * Verifies a password against a hash
 *
 * @param hash - The hashed password
 * @param password - The plain text password to verify
 * @returns Promise<boolean> - True if the password matches the hash, false otherwise
 */
export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
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