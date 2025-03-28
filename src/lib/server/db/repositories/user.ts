import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/user';
import type { User } from '$lib/server/db/schema/user';
import type { Provider } from '$lib/server/db/schema/types';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';

export const userRepo = {
    async create(userData: User): Promise<User> {
        const [newUser] = await db.insert(user)
            .values({
                ...userData,
            })
            .returning();

        return newUser as User;
    },

    async getById(userId: string): Promise<User | undefined> {
        const [foundUser] = await db.select()
            .from(user)
            .where(eq(user.id, userId));
        return foundUser as User;
    },

    async getByEmail(email: string): Promise<User | undefined> {
        const [foundUser] = await db.select()
            .from(user)
            .where(eq(user.email, email));
        return foundUser as User;
    },

    async getByProviderId(provider: string, providerId: string): Promise<User | undefined> {
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
    },

    async getPasswordHash(userId: string): Promise<string | undefined> {
        const [result] = await db
            .select({ passwordHash: user.passwordHash })
            .from(user)
            .where(eq(user.id, userId));

        return result.passwordHash ?? undefined;
    },

    async setEmailVerifiedIfEmailMatches(userId: string, email: string): Promise<boolean> {
        const result = await db.update(user)
            .set({ emailVerified: true })
            .where(and(
                eq(user.id, userId),
                eq(user.email, email)
            ));
        return result.rowsAffected > 0;
    },

    async updatePassword(userId: string, password: string): Promise<void> {
        const passwordHash = await hashPassword(password);
        await db.update(user)
            .set({
                passwordHash
            })
            .where(eq(user.id, userId))
            .run();
    },

    async updateEmailAndSetVerified(userId: string, email: string): Promise<void> {
        await db.update(user)
            .set({
                email,
                emailVerified: true
            })
            .where(eq(user.id, userId))
            .run();
    },

    async isEmailTaken(email: string): Promise<boolean> {
        const existingUser = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .get();
        return !!existingUser;
    }
}; 