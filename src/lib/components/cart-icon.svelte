<script lang="ts">
	import { ShoppingCart } from 'lucide-svelte/icons';
	import { cart } from '$lib/stores/cart';
	import * as m from '$lib/paraglide/messages';

	// Simple state, with no derived reactivity
	let currentCount = $state(0);
	let shouldAnimate = $state(false);
	let initialized = $state(false);

	// Update the count when the cart store changes
	$effect(() => {
		const newCount = $cart.itemCount || 0;
		const oldCount = currentCount;

		// Update the count
		currentCount = newCount;

		// Don't animate on first load
		if (!initialized) {
			initialized = true;
			return;
		}

		// Animate only when count increases
		if (newCount > oldCount) {
			shouldAnimate = true;
			// Reset animation after 1 second
			setTimeout(() => {
				shouldAnimate = false;
			}, 1000);
		}
	});
</script>

<a href="/cart" class="relative" aria-label={m.nav_cart()}>
	<ShoppingCart strokeWidth={1.5} size={24} />

	{#if currentCount > 0}
		<span
			class="absolute -top-2 -right-2 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5"
			class:animate-bounce={shouldAnimate}
		>
			{currentCount}
		</span>
	{/if}
</a>
