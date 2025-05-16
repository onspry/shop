import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie, sessionCookieName } from "$lib/server/auth/session";
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(sessionToken);
	if (session) {
		setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
		event.locals.user = user;
		event.locals.session = session;
	} else {
		deleteSessionTokenCookie(event);
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};

// Paraglide middleware
const paraglideHandle: Handle = ({ event, resolve }) => {
	// Skip language processing for static assets and favicon requests
	const path = new URL(event.request.url).pathname;
	const isStaticAsset = path.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|mp4|webm|ogg|mp3|wav|pdf|txt|xml|json|woff|woff2|ttf|eot)$/i);

	if (isStaticAsset) {
		return resolve(event);
	}

	return paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;

		// Always use 'en-US' as fallback if locale is undefined
		const safeLocale = locale || 'en-US';

		// Add locale to event.locals to make it accessible in server-side rendering
		event.locals.paraglide = {
			locale: safeLocale,
			lang: safeLocale,
			textDirection: 'ltr'
		};

		// Ensure the cookie is set when accessing URLs directly
		if (event.cookies && !event.cookies.get('PARAGLIDE_LOCALE')) {
			event.cookies.set('PARAGLIDE_LOCALE', safeLocale, {
				path: '/',
				httpOnly: false,
				maxAge: 60 * 60 * 24 * 365, // 1 year
				sameSite: 'lax'
			});
		}

		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html
					.replace('%lang%', safeLocale)
					.replace('%paraglide.textDirection%', 'ltr'); // All supported languages use left-to-right
			}
		});
	});
};

/**
 * The handle hook is required for:
 * 1. Setting the paraglide_lang cookie when language changes
 * 2. Adding language info to event.locals.paraglide
 * 3. Setting the lang and dir attributes on the HTML element
 */
export const handle: Handle = sequence(handleAuth, paraglideHandle);
