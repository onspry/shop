import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { Provider, User } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from './password';

export function verifyUsernameInput(username: string): boolean {
    return username.length > 3 && username.length < 32 && username.trim() === username;
}

export async function createUser(userData: User): Promise<User> {
    const [newUser] = await db.insert(user)
        .values({
            ...userData,
        })
        .returning();

    return newUser as User;
}

export async function getUserById(userId: string): Promise<User | undefined> {
    const [foundUser] = await db.select()
        .from(user)
        .where(eq(user.id, userId));
    return foundUser as User;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const [foundUser] = await db.select()
        .from(user)
        .where(eq(user.email, email));
    return foundUser as User;
}

export async function getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    console.log('Getting User by Provider ID:', provider, providerId);
    const [foundUser] = await db.select()
        .from(user)
        .where(
            and(
                eq(user.provider, provider as Provider),
                eq(user.providerId, providerId)
            )
        );
    console.log('Found User:', foundUser);
    return foundUser as User;
}

export async function getUserPasswordHash(userId: string): Promise<string | undefined> {
    const [result] = await db
        .select({ passwordHash: user.passwordHash })
        .from(user)
        .where(eq(user.id, userId));

    return result.passwordHash;
}

export async function updateUserPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await hashPassword(password);
    await db.update(user)
        .set({
            passwordHash
        })
        .where(eq(user.id, userId))
        .run();
}

export async function updateUserEmailAndSetEmailAsVerified(userId: string, email: string): Promise<void> {
    await db.update(user)
        .set({
            email,
            email_verified: 1
        })
        .where(eq(user.id, userId))
        .run();
}

export async function isEmailTaken(email: string): Promise<boolean> {
    const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .get();
    return !!existingUser;
}
