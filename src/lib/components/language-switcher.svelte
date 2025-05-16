<script lang="ts">
	import { locales, localizeUrl, getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { Button } from '$lib/components/ui/button';
	import { Globe } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';

	// Props
	let { isMobile = false } = $props();

	// Type for available locales
	type AvailableLocale = (typeof locales)[number];

	// Language display names mapped to locales
	function getLanguageName(lang: string) {
		switch (lang) {
			case 'en-US':
				return m.language_english() + ' (US)';
			case 'en-UK':
				return m.language_english() + ' (UK)';
			case 'de-DE':
				return m.language_german() + ' (DE)';
			case 'fr-FR':
				return m.language_french() + ' (FR)';
			case 'zh-CN':
				return m.language_chinese() + ' (CN)';
			default:
				return lang;
		}
	}

	// Language flag emoji (optional)
	const languageFlags = {
		'en-US': '🇺🇸',
		'en-UK': '🇬🇧',
		'de-DE': '🇩🇪',
		'fr-FR': '🇫🇷',
		'zh-CN': '🇨🇳'
	};

	// Initialize current language with fallback
	let currentLanguage = $state<AvailableLocale>('en-US');

	// Safely get the current locale
	function updateCurrentLanguage() {
		try {
			const locale = getLocale();
			if (locale && locales.includes(locale as AvailableLocale)) {
				currentLanguage = locale as AvailableLocale;
			}
		} catch (error) {
			console.error('Error getting locale in language switcher:', error);
		}
	}

	// Initial update
	updateCurrentLanguage();

	// Update the language reactively when in browser
	$effect(() => {
		if (browser) {
			updateCurrentLanguage();
		}
	});

	// Handle language change
	async function changeLanguage(lang: AvailableLocale) {
		if (browser && lang !== currentLanguage) {
			try {
				// Let Paraglide handle the state
				setLocale(lang);

				// Get the current path segments
				const pathSegments = window.location.pathname.split('/').filter(Boolean);

				// Remove the language prefix if it exists
				const langPrefixes = ['en-uk', 'de-de', 'fr-fr', 'zh-cn'];
				if (pathSegments[0] && langPrefixes.includes(pathSegments[0].toLowerCase())) {
					pathSegments.shift();
				}

				// Reconstruct the base path without locale
				const basePath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/';

				// Create the new URL with search params and hash
				const newUrl = new URL(basePath, window.location.origin);
				newUrl.search = window.location.search;
				newUrl.hash = window.location.hash;

				// Let Paraglide localize the clean URL
				const localizedUrl = localizeUrl(newUrl.href, { locale: lang });

				// Navigate to the new URL
				await goto(localizedUrl, {
					invalidateAll: true
				});
			} catch (error) {
				console.error('Error changing language:', error);
			}
		}
	}

	// Active language styles
	const activeStyle =
		'background-color: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); font-weight: 500;';
</script>

{#if isMobile}
	<!-- Mobile language switcher -->
	<div class="grid grid-cols-2 gap-2">
		{#each locales as lang}
			<Button
				variant="outline"
				size="sm"
				onclick={() => changeLanguage(lang)}
				class="justify-start"
				data-active={currentLanguage === lang}
			>
				<span>{getLanguageName(lang)}</span>
			</Button>
		{/each}
	</div>
{:else}
	<!-- Desktop dropdown language switcher -->
	<DropdownMenu>
		<DropdownMenuTrigger>
			<div
				class="inline-flex h-10 w-10 items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
				aria-label={m.sr_change_language()}
			>
				<Globe class="h-[1.2rem] w-[1.2rem]" />
				<span class="sr-only">{m.sr_change_language()}</span>
			</div>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{#each locales as lang}
				<DropdownMenuItem
					onclick={() => changeLanguage(lang)}
					class="flex cursor-pointer items-center gap-2"
					style={currentLanguage === lang ? activeStyle : ''}
					data-lang={lang}
				>
					{#if currentLanguage === lang}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4 text-primary"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<div class="w-4"></div>
					{/if}
					{getLanguageName(lang)}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
{/if}
