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
			cookieDomain: '',  // Empty string = same-origin only, works for both dev and prod
			cookieMaxAge: 365 * 24 * 60 * 60, // 1 year
			urlPatterns: [
				{
					pattern: "/:path(.*)?",
					localized: [
						// Note: Order matters here!
						// More specific patterns (with language prefixes) first
						["en-UK", "/en-uk/:path(.*)?"],
						["de-DE", "/de-de/:path(.*)?"],
						["fr-FR", "/fr-fr/:path(.*)?"],
						["zh-CN", "/zh-cn/:path(.*)?"],
						// Default language (en-US) last with no prefix
						["en-US", "/:path(.*)?"]
					]
				}
			]
		})
	],
	optimizeDeps: {
		exclude: [
			'@inlang/paraglide-js',
			'@inlang/paraglide-runtime',
			'@inlang/paraglide-js-adapter-sveltekit'
		]
	},
	build: {
		rollupOptions: {
			external: ['crypto', 'fs', 'path', 'buffer']
		}
	}
});
