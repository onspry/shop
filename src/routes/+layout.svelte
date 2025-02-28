<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Check system preference or stored preference
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const storedTheme = localStorage.getItem('theme');

		if (storedTheme === 'dark' || (!storedTheme && isDark)) {
			document.documentElement.classList.add('dark');
		}
	});
</script>

<ParaglideJS {i18n}>
	<div class="min-h-screen bg-background font-sans antialiased">
		<header
			class="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] border-b bg-background/80 backdrop-blur-sm"
		>
			<div class="container mx-auto h-full px-4 md:px-6">
				<ModeWatcher />
				<Navbar />
			</div>
		</header>

		<main class="main-container container mx-auto px-4 md:px-6">
			{@render children()}
		</main>

		<footer
			class="fixed bottom-0 left-0 right-0 h-[var(--footer-height)] border-t bg-background/80 backdrop-blur-sm"
		>
			<Footer />
		</footer>
	</div>
</ParaglideJS>
