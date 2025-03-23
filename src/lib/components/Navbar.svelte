<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import AuthSection from './auth-section.svelte';
	import DarkmodeToggle from './darkmode-toggle.svelte';
	import CartIcon from './cart/cart-icon.svelte';
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.
</script>

<nav class="h-full w-full">
	<div class="flex h-full w-full items-center justify-between">
		<div class="flex items-center gap-8">
			<a href="/" class="flex h-full items-center" aria-label={m.shop_title()}>
				<div class="logo" aria-label={m.shop_title()}></div>
			</a>
			<div class="hidden md:flex items-center gap-6">
				<a href="/about" class="text-sm font-medium hover:text-primary transition-colors">About</a>
			</div>
			<div class="hidden md:flex items-center gap-6">
				<a href="/products" class="text-sm font-medium hover:text-primary transition-colors"
					>Products</a
				>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<CartIcon />
			<DarkmodeToggle />
			<AuthSection />
		</div>
	</div>
</nav>
