<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';

	// Destructure the renderable children (avoid using <slot> per Svelte 5 guidelines).
	let { data, children } = $props();
</script>

<ParaglideJS {i18n}>
	<div>
		<Navbar user={data.user} />
		<main>
			{@render children()}
		</main>
		<Footer />
	</div>
</ParaglideJS>
