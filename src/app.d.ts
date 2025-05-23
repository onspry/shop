/// <reference types="@sveltejs/kit" />
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth/auth.server').SessionValidationResult['user'];
			session: import('$lib/server/auth/auth.server').SessionValidationResult['session'];
		}
	}
}

declare module '$env/static/private' {
	// Database Configuration
	export const DATABASE_URL: string;
	export const DIRECT_URL: string;

	// GitHub OAuth Configuration
	export const GITHUB_CLIENT_ID: string;
	export const GITHUB_CLIENT_SECRET: string;
	export const GITHUB_CLIENT_REDIRECT_URI: string;

	// Microsoft Graph API Configuration
	export const MS_GRAPH_CLIENT_ID: string;
	export const MS_GRAPH_CLIENT_SECRET: string;
	export const MS_GRAPH_TENANT_ID: string;

	// Email Addresses
	export const EMAIL_NOREPLY: string;
	export const EMAIL_SUPPORT: string;

	// Security
	export const PWNED_PASSWORDS_API_URL: string;
}

export { };
