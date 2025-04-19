<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';
	import { onMount } from 'svelte';
	import { setUser } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { Toaster } from '$lib/components/ui/sonner';
	import { cart } from '$lib/stores/cart';
	import { checkoutStore } from '$lib/stores/checkout';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children, data } = $props();
	let cartInitialized = $state(false);

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

	// Initialize theme on mount
	onMount(() => {
		// The theme store will handle initialization from localStorage or system preference
		const isDark = $theme === 'dark';
		document.documentElement.classList.toggle('dark', isDark);
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

<ParaglideJS {i18n}>
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

	<Toaster
		richColors
		closeButton
		toastOptions={{
			classes: {
				success: 'toast-success',
				error: 'toast-error',
				actionButton: 'toast-action'
			},
			duration: 4000
		}}
	/>
</ParaglideJS>
