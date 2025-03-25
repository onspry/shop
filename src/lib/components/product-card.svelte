<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import {
		product_starting_at,
		product_view_details,
		product_accessory
	} from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ImageOff } from 'lucide-svelte';
	import { Button } from './ui/button';

	let { product } = $props<{
		product: ProductViewModel;
	}>();

	// Helper function to get optimized image URL
	function getOptimizedImageUrl(url: string): string {
		// Optimize for card view - 400px width, 80% quality, WebP format
		return `${url}?w=300&h=300&q=80&format=webp`;
	}

	const basePrice = $derived(
		product.variants.length > 0
			? Math.min(...product.variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
	);

	const hasMultipleVariants = $derived(product.variants.length > 1);

	let imageError = $state(false);
	let imageLoaded = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}
</script>

<div
	class="group relative bg-background ring-2 ring-border hover:ring-primary rounded-xl overflow-hidden transition-colors duration-300 hover:shadow-lg"
>
	<div class="relative h-48">
		<div class="absolute inset-0 flex items-center justify-center bg-muted">
			{#if imageError || !product.images.length}
				<ImageOff class="h-10 w-10 text-muted-foreground" />
			{:else}
				{#if !imageLoaded}
					<div class="absolute inset-0">
						<div class="h-full w-full animate-pulse bg-muted-foreground/20"></div>
					</div>
				{/if}
				<img
					src={getOptimizedImageUrl(product.images[0].url)}
					alt={product.images[0].alt}
					width={300}
					height={300}
					loading="lazy"
					class="max-h-48 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
					class:opacity-0={!imageLoaded}
					class:opacity-100={imageLoaded}
					onerror={handleImageError}
					onload={handleImageLoad}
				/>
			{/if}
		</div>
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
			<Button
				class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-300"
				onclick={() => (window.location.href = `/products/${product.slug}`)}
			>
				{product_view_details()}
			</Button>

			{#if product.isAccessory}
				<span class="text-sm text-muted-foreground">
					{product_accessory()}
				</span>
			{/if}
		</div>
	</div>
</div>
