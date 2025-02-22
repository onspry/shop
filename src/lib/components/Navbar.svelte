<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import AuthSection from './AuthSection.svelte';
	import type { User } from '$lib/server/db/schema';
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.

	export let user: User | null = null;
</script>

<nav class="w-full bg-transparent px-8 py-5">
	<div class="relative z-10 flex items-center justify-between">
		<div class="text-xl font-semibold tracking-tight">
			<a href="/" class="block text-[var(--color-primary)]">
				{m.shop_title()}
			</a>
		</div>
		<div class="flex items-center space-x-8">
			<a href="/cart" class="flex items-center text-base font-medium" aria-label={m.nav_cart()}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</a>
			<AuthSection {user} />
		</div>
	</div>
</nav>
