import { sequence } from '@sveltejs/kit/hooks';
import { i18n } from '$lib/i18n';
import type { Handle } from '@sveltejs/kit';
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie, sessionCookieName } from "$lib/server/auth/session";

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(sessionToken);
	if (session) {
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

const handleParaglide: Handle = i18n.handle();
export const handle: Handle = sequence(handleAuth, handleParaglide);
