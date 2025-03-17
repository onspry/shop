<!-- ProductCard.svelte -->
<script lang="ts">
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db/schema';
	import {
		product_starting_at,
		product_view_details,
		product_accessory
	} from '$lib/paraglide/messages';

	let { product, variants, images } = $props<{
		product: Product;
		variants: ProductVariant[];
		images: ProductImage[];
	}>();

	const basePrice = $derived(
		variants.length > 0 ? Math.min(...variants.map((v: ProductVariant) => Number(v.price))) : 0
	);

	const hasMultipleVariants = $derived(variants.length > 1);
</script>

<div
	class="group relative bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
>
	<div class="relative h-48 overflow-hidden">
		{#if images.length > 0}
			<img
				src={images[0].url}
				alt={images[0].alt}
				class="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center bg-muted">
				<span class="text-muted-foreground text-sm">No image available</span>
			</div>
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
				${basePrice.toFixed(2)}
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
