import { getUserByEmail, getUserPasswordHash } from "$lib/server/auth/user";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/auth/session";
import { verifyPasswordHash } from "$lib/server/auth/password";
import { verifyEmailInput } from "$lib/server/auth/email";
import type { RequestEvent } from "@sveltejs/kit";

export async function POST(event: RequestEvent): Promise<Response> {
    const formData = await event.request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
        return new Response(JSON.stringify({
            message: "Invalid or missing fields"
        }), { status: 400 });
    }

    if (email === "" || password === "") {
        return new Response(JSON.stringify({
            message: "Please enter your email and password."
        }), { status: 400 });
    }

    if (!verifyEmailInput(email)) {
        return new Response(JSON.stringify({
            message: "Invalid email"
        }), { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
        return new Response(JSON.stringify({
            message: "Account does not exist"
        }), { status: 400 });
    }

    const passwordHash = await getUserPasswordHash(user.id);
    if (!passwordHash) {
        return new Response(JSON.stringify({
            message: "Invalid user"
        }), { status: 400 });
    }

    const validPassword = await verifyPasswordHash(passwordHash, password);
    if (!validPassword) {
        return new Response(JSON.stringify({
            message: "Invalid password"
        }), { status: 400 });
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);

    return new Response(null, {
        status: 302,
        headers: {
            Location: "/"
        }
    });
} 