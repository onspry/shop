import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { verifyEmailInput } from "$lib/server/auth/email";
import { getUserByEmail, getUserPasswordHash } from "$lib/server/auth/user";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/auth/session";

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.session !== null && locals.user !== null) {
        throw redirect(302, "/");
    }
    return {};
};

export const actions: Actions = {
    email: async (event) => {
        const { request } = event;
        const data = await request.formData();
        const email = data.get("email");
        const password = data.get("password");

        if (typeof email !== "string" || typeof password !== "string") {
            return { error: "Invalid or missing fields" };
        }

        if (email === "" || password === "") {
            return fail(400, { error: "Please enter your email and password." });
        }

        if (!verifyEmailInput(email)) {
            return fail(400, { error: "Invalid email" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return fail(400, { error: "Account does not exist" });
        }

        const passwordHash = await getUserPasswordHash(user.id);
        if (!passwordHash) {
            return fail(400, { error: "Invalid user" });
        }

        const validPassword = await verifyPasswordHash(passwordHash, password);
        if (!validPassword) {
            return fail(400, { error: "Invalid password" });
        }

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id);
        setSessionTokenCookie(event, sessionToken, session.expiresAt);

        throw redirect(303, "/");
    }
};