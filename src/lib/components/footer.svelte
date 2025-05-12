<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	// Compute the current year for the copyright text.
	const currentYear = new Date().getFullYear();
</script>

<div class="flex h-full w-full items-center justify-between">
	<p class="text-sm text-muted-foreground">
		&copy; {currentYear} Onspry. {m.footer_text({ year: currentYear })}
	</p>
	<nav class="flex gap-4 text-sm text-muted-foreground">
		<a href="/privacy" class="hover:underline hover:text-foreground">Privacy</a>
		<a href="/terms" class="hover:underline hover:text-foreground">Terms</a>
	</nav>
</div>
