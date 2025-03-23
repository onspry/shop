<script lang="ts">
	import { ShoppingCart } from 'lucide-svelte';
	import { cart } from '$lib/stores/cart';
	import * as m from '$lib/paraglide/messages';

	// Add derived state to detect count changes
	let previousCount = $state(0);
	let animateCount = $state(false);

	// Effect to detect count changes and trigger animation
	$effect(() => {
		if (previousCount !== 0 && previousCount !== $cart.itemCount) {
			animateCount = true;
			setTimeout(() => {
				animateCount = false;
			}, 1000);
		}
		previousCount = $cart.itemCount;
	});
</script>

<a
	href="/cart"
	class="flex items-center relative text-foreground hover:text-primary transition-colors"
	aria-label={m.nav_cart()}
>
	<ShoppingCart class="h-5 w-5 {$cart.itemCount > 0 ? 'text-primary' : ''}" aria-hidden="true" />
	{#if $cart.itemCount > 0}
		<span
			class="absolute -top-2 -right-2 flex items-center justify-center
			bg-primary text-primary-foreground font-medium
			text-xs rounded-full min-w-5 h-5 px-1.5
			{animateCount ? 'animate-bounce' : ''}"
			aria-label="{$cart.itemCount} {$cart.itemCount === 1 ? 'item' : 'items'} in cart"
		>
			{$cart.itemCount < 100 ? $cart.itemCount : '99+'}
		</span>
	{/if}
</a>
