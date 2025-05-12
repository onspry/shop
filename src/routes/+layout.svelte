<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { onMount } from 'svelte';
	import { setUser } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { Toaster } from '$lib/components/ui/sonner';
	import { cart } from '$lib/stores/cart';
	import { checkoutStore } from '$lib/stores/checkout';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { setLocale, getLocale } from '$lib/paraglide/runtime.js';
	import { invalidate } from '$app/navigation';

	let { children, data } = $props();
	let cartInitialized = $state(false);

	// Type for available locales
	type AvailableLocale = 'en' | 'de' | 'fr' | 'cn';

	// Initialize locale immediately from server data for SSR
	if (data.paraglide?.lang) {
		try {
			setLocale(data.paraglide.lang as AvailableLocale, { reload: false });
		} catch (error) {
			console.error('Error setting initial locale during SSR:', error);
			// Force fallback to 'en'
			setLocale('en', { reload: false });
		}
	}

	// Initialize browser-specific settings on mount
	onMount(() => {
		if (browser) {
			try {
				// Set theme
				const isDark = $theme === 'dark';
				document.documentElement.classList.toggle('dark', isDark);

				// Set HTML lang attribute (Paraglide handles the actual locale)
				document.documentElement.lang = getLocale();

				// Sync cookie with URL language on initial page load (OOTB approach)
				// This ensures if someone lands on /de/products, the cookie gets set to 'de'
				if (window.location.pathname) {
					const pathSegments = window.location.pathname.split('/').filter(Boolean);
					const firstSegment = pathSegments[0];

					// If URL starts with a valid locale, ensure the cookie matches
					if (firstSegment && ['en', 'de', 'fr', 'cn'].includes(firstSegment)) {
						// Get current locale from cookie/state
						const currentLocale = getLocale();

						// Only update if they don't match (URL has locale but cookie doesn't match)
						if (currentLocale !== firstSegment) {
							console.log(`Setting locale cookie to match URL: ${firstSegment}`);
							setLocale(firstSegment as 'en' | 'de' | 'fr' | 'cn', { reload: false });
						}
					}
				}
			} catch (error) {
				console.error('Error in layout onMount:', error);
			}
		}
	});

	// Update HTML lang attribute when the page loads
	$effect(() => {
		if (browser && document.documentElement) {
			try {
				const currentLang = getLocale();
				document.documentElement.lang = currentLang;
			} catch (error) {
				console.error('Error updating HTML lang attribute:', error);
				document.documentElement.lang = 'en';
			}
		}
	});

	// Update context when user changes
	$effect(() => {
		// Set user data from server
		setUser(data.user);
	});

	// Hydrate cart store ONLY on first load
	$effect(() => {
		if (!cartInitialized && data.cart) {
			cart.set(data.cart);
			cartInitialized = true;
		}
	});

	// Handle checkout store reset
	beforeNavigate(({ to }) => {
		// Reset checkout store before navigating to logout
		if (to?.url.pathname === '/auth/logout') {
			console.log('Navigating to logout page, resetting checkout store');
			checkoutStore.reset();

			// Force clear localStorage directly as a backup
			if (browser) {
				try {
					localStorage.removeItem('checkout_data');
					console.log('Directly removed checkout data from localStorage');
				} catch (error) {
					console.error('Failed to remove checkout data from localStorage:', error);
				}
			}
		}
	});

	// Handle user state after navigation
	afterNavigate(({ from }) => {
		// Check for the X-Clear-Checkout header in the response
		if (from?.url.pathname === '/auth/logout') {
			console.log('Coming from logout page, resetting checkout store and user');
			checkoutStore.reset();
			setUser(null);

			// Force clear localStorage directly as a backup
			if (browser) {
				try {
					localStorage.removeItem('checkout_data');
					console.log('Directly removed checkout data from localStorage after logout');
				} catch (error) {
					console.error('Failed to remove checkout data from localStorage after logout:', error);
				}
			}
		}
	});
</script>

<div class="flex min-h-screen w-full flex-col bg-background font-sans antialiased">
	<header
		class="sticky top-0 z-50 w-full h-[var(--header-height)] border-b bg-background/80 backdrop-blur-sm"
	>
		<div class="max-w-[1400px] mx-auto w-full h-full px-4 sm:px-6 md:px-8 lg:px-12">
			<Navbar />
		</div>
	</header>

	<main class="flex-1 w-full">
		<div class="max-w-[1400px] mx-auto w-full h-full px-4 py-4 sm:px-6 md:px-8 lg:px-12">
			{@render children()}
		</div>
	</main>

	<footer class="w-full h-[var(--footer-height)] border-t bg-background/80 backdrop-blur-sm">
		<div class="max-w-[1400px] mx-auto w-full h-full px-4 sm:px-6 md:px-8 lg:px-12">
			<Footer />
		</div>
	</footer>
</div>

<!-- Toast positioned above footer on the right side -->
<Toaster
	richColors
	closeButton
	position="bottom-right"
	offset={65}
	toastOptions={{
		classes: {
			success: 'toast-success',
			error: 'toast-error',
			actionButton: 'toast-action'
		},
		duration: 8000 // Increased from 4000 to 8000 ms
	}}
/>
