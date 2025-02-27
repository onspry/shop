<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import AuthSection from './AuthSection.svelte';
	import type { User } from '$lib/server/db/schema';
	import DarkmodeToggle from './darkmode-toggle.svelte';
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.

	export let user: User | null = null;
</script>

<nav class="h-full">
	<div class="flex h-full items-center justify-between">
		<a href="/" class="flex h-full items-center" aria-label={m.shop_title()}>
			<div class="logo" aria-label={m.shop_title()}></div>
		</a>
		<div class="flex items-center gap-4">
			<DarkmodeToggle />
			<AuthSection {user} />
		</div>
	</div>
</nav>
