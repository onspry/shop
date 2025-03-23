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

	let { children, data } = $props();

	// Update context when user changes
	$effect(() => {
		// Set user data from server
		setUser(data.user);
	});

	// Initialize theme on mount
	onMount(() => {
		// The theme store will handle initialization from localStorage or system preference
		const isDark = $theme === 'dark';
		document.documentElement.classList.toggle('dark', isDark);
	});
</script>

<ParaglideJS {i18n}>
	<div class="flex min-h-screen w-full flex-col bg-background font-sans antialiased">
		<header
			class="sticky top-0 z-50 w-full h-[var(--header-height)] border-b bg-background/80 backdrop-blur-sm"
		>
			<div class="layout-container h-full">
				<Navbar />
			</div>
		</header>

		<main class="flex-1 w-full py-8">
			<div class="layout-container">
				{@render children()}
			</div>
		</main>

		<footer class="w-full h-[var(--footer-height)] border-t bg-background/80 backdrop-blur-sm">
			<div class="layout-container h-full">
				<Footer />
			</div>
		</footer>
	</div>
</ParaglideJS>
