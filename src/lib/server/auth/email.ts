import { eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db_drizzle/schema';
import { user } from '$lib/server/db_drizzle/schema/user';

export function verifyEmailInput(email: string): boolean {
    return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
    const [result] = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.email, email));

    return result.count === 0;
}