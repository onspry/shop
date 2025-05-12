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

	// Props
	let { isMobile = false } = $props();

	// Type for available locales
	type AvailableLocale = (typeof locales)[number];

	// Language display names mapped to locales
	const languageNames = {
		en: 'English',
		de: 'Deutsch',
		fr: 'Français',
		cn: '中文'
	};

	// Language flag emoji (optional)
	const languageFlags = {
		en: '🇺🇸',
		de: '🇩🇪',
		fr: '🇫🇷',
		cn: '🇨🇳'
	};

	// Initialize current language with fallback
	let currentLanguage = $state<AvailableLocale>('en');

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
				// Use setLocale to set the cookie
				setLocale(lang, { reload: false });

				// Use full URL instead of just pathname to avoid parsing errors
				const fullUrl = page.url.href;

				// Let Paraglide handle the URL transformation with the complete URL
				const localizedUrl = localizeUrl(fullUrl, { locale: lang });

				// Method 1: Use window.location for a full page refresh
				window.location.href = typeof localizedUrl === 'string' ? localizedUrl : localizedUrl.href;

				// Method 2: Alternative approach - use goto with invalidation
				// This approach avoids a full page refresh but might not work in all cases
				/*
				await goto(localizedUrl, { replaceState: true, invalidateAll: true });
				
				// Update current language immediately for better UX
				currentLanguage = lang;
				
				// Force re-render by dispatching a custom event
				window.dispatchEvent(new CustomEvent('language-changed', { detail: { locale: lang } }));
				*/
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
				<span>{languageNames[lang]}</span>
			</Button>
		{/each}
	</div>
{:else}
	<!-- Desktop dropdown language switcher -->
	<DropdownMenu>
		<DropdownMenuTrigger>
			<div
				class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground"
				aria-label="Change language"
			>
				<Globe class="h-[1.2rem] w-[1.2rem]" />
				<span class="sr-only">Change language</span>
			</div>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{#each locales as lang}
				<DropdownMenuItem
					onclick={() => changeLanguage(lang)}
					class="cursor-pointer flex items-center gap-2"
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
					{languageNames[lang]}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
{/if}
