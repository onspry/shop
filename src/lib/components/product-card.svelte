<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/types/product';
	import {
		product_starting_at,
		product_view_details,
		product_accessory
	} from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';

	let { product } = $props<{
		product: ProductViewModel;
	}>();

	const basePrice = $derived(
		product.variants.length > 0
			? Math.min(...product.variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
	);

	const hasMultipleVariants = $derived(product.variants.length > 1);

	// Handle image error by replacing with fallback
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.src = '/placeholder.png';
		img.alt = 'Product placeholder';
	}
</script>

<div
	class="group relative bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
>
	<div class="relative h-48 overflow-hidden">
		{#if product.images.length > 0}
			<img
				src={product.images[0].url}
				alt={product.images[0].alt}
				class="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
				onerror={handleImageError}
			/>
		{:else}
			<img
				src="/placeholder.png"
				alt="Product placeholder"
				class="w-full h-full object-contain object-center"
			/>
		{/if}
	</div>

	<div class="p-4">
		<div class="mb-2">
			<span class="text-xs font-medium text-muted-foreground uppercase">
				{product.category}
			</span>
		</div>

		<h3 class="text-lg font-semibold text-foreground mb-2">
			{product.name}
		</h3>

		<div class="flex items-baseline mb-2">
			<span class="text-xl font-bold text-foreground">
				{formatPrice(basePrice)}
			</span>
			{#if hasMultipleVariants}
				<span class="ml-2 text-sm text-muted-foreground">
					{product_starting_at()}
				</span>
			{/if}
		</div>

		<p class="text-sm text-muted-foreground line-clamp-2 mb-4">
			{product.description}
		</p>

		<div class="flex justify-between items-center">
			<button
				class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-300"
				onclick={() => (window.location.href = `/products/${product.slug}`)}
			>
				{product_view_details()}
			</button>

			{#if product.isAccessory}
				<span class="text-sm text-muted-foreground">
					{product_accessory()}
				</span>
			{/if}
		</div>
	</div>
</div>
