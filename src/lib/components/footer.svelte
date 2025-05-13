<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
	// Compute the current year for the copyright text.
	const currentYear = new Date().getFullYear();
</script>

<div class="flex h-full w-full items-center justify-between">
	<p class="text-sm text-muted-foreground">
		&copy; {currentYear} Onspry. {m.footer_text({ year: currentYear })}
	</p>
	<nav class="flex gap-4 text-sm text-muted-foreground">
		<a href={localizeHref('/privacy')} class="hover:underline hover:text-foreground"
			>{m.footer_privacy()}</a
		>
		<a href={localizeHref('/terms')} class="hover:underline hover:text-foreground"
			>{m.footer_terms()}</a
		>
	</nav>
</div>
