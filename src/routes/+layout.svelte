<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';
	import { ModeWatcher } from 'mode-watcher';

	// Destructure the renderable children (avoid using <slot> per Svelte 5 guidelines).
	let { data, children } = $props();
</script>

<ParaglideJS {i18n}>
	<div class="min-h-screen bg-background font-sans antialiased">
		<header
			class="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] border-b bg-background/80 px-4 backdrop-blur-sm"
		>
			<ModeWatcher />
			<Navbar user={data.user} />
		</header>

		<main class="main-container container px-4 py-6">
			{@render children()}
		</main>

		<footer
			class="fixed bottom-0 left-0 right-0 h-[var(--footer-height)] border-t bg-background/80 px-4 backdrop-blur-sm"
		>
			<Footer />
		</footer>
	</div>
</ParaglideJS>
