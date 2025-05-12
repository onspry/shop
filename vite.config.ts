import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale'],
			disableAsyncLocalStorage: true,
			cookieDomain: '',  // Empty string means same-origin only
			cookieMaxAge: 365 * 24 * 60 * 60, // 1 year
			urlPatterns: [
				{
					pattern: "/:path(.*)?",
					localized: [
						// Note: Order matters here!
						// More specific patterns (with language prefixes) first
						["de", "/de/:path(.*)?"],
						["fr", "/fr/:path(.*)?"],
						["cn", "/cn/:path(.*)?"],
						// Default language (en) last with no prefix
						["en", "/:path(.*)?"]
					]
				}
			]
		})
	],
	build: {
		rollupOptions: {
			external: ['crypto', 'fs', 'path', 'buffer']
		}
	}
});
