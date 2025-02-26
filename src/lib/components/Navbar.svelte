<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import AuthSection from './AuthSection.svelte';
	import type { User } from '$lib/server/db/schema';
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.

	export let user: User | null = null;
</script>

<nav>
	<div>
		<div>
			<a href="/">{m.shop_title()}</a>
		</div>
		<div>
			<AuthSection {user} />
		</div>
	</div>
</nav>
