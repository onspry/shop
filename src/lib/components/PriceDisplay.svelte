<script lang="ts">
	import { formatPrice } from '$lib/utils/price';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import type { Locale } from '$lib/utils/localization';

	// Props
	const { price } = $props<{
		price: number;
	}>();

	$effect(() => {
		// This will re-run when the locale changes
		const locale = getLocale() as Locale;
		formattedPrice = formatPrice(price, locale);
	});

	let formattedPrice = $state('');
</script>

<span class="price">{formattedPrice}</span>

<style>
	.price {
		font-weight: 600;
	}
</style>
