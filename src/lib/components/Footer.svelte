<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	// Compute the current year for the copyright text.
	const currentYear = new Date().getFullYear();
</script>

<div
	class="container mx-auto flex h-[var(--footer-height)] items-center justify-between px-4 md:px-6"
>
	<p class="text-sm text-muted-foreground">
		&copy; {currentYear} Onspry. {m.footer_text()}
	</p>
	<nav class="flex gap-4 text-sm text-muted-foreground">
		<a href="/privacy" class="hover:underline hover:text-foreground">Privacy</a>
		<a href="/terms" class="hover:underline hover:text-foreground">Terms</a>
	</nav>
</div>
