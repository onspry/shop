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
	import { setUser } from '$lib/stores/auth';

	let { children, data } = $props();
	console.log('Layout props data:', data);

	// Update context when user changes
	$effect(() => {
		// Set user data from server
		setUser(data.user);
	});

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
	<div class="layout-container flex min-h-screen flex-col bg-background font-sans antialiased">
		<header
			class="sticky top-0 z-50 h-[var(--header-height)] border-b bg-background/80 backdrop-blur-sm"
		>
			<div class="h-full">
				<ModeWatcher />
				<Navbar />
			</div>
		</header>

		<main class="flex-1 py-8">
			{@render children()}
		</main>

		<footer class="h-[var(--footer-height)] border-t bg-background/80 backdrop-blur-sm">
			<div class="h-full">
				<Footer />
			</div>
		</footer>
	</div>
</ParaglideJS>
