import { prisma } from '$lib/server/db';

/**
 * Verifies that an email input is valid
 * @param email - The email to verify
 * @returns True if the email is valid, false otherwise
 */
export function verifyEmailInput(email: string): boolean {
    return /^.+@.+\..+$/.test(email) && email.length < 256;
}

/**
 * Checks if an email is available (not already registered)
 * @param email - The email to check
 * @returns Promise that resolves to true if the email is available, false otherwise
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
    const count = await prisma.user.count({
        where: {
            email: email
        }
    });

    return count === 0;
}