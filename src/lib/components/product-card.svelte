<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import { product_starting_at, product_view_details } from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ImageOff } from 'lucide-svelte';

	let { product, class: className = '' } = $props<{
		product: ProductViewModel;
		class?: string;
	}>();

	// Helper function to get optimized image URL
	function getOptimizedImageUrl(url: string): string {
		return `${url}?w=800&q=80&format=webp`;
	}

	const basePrice = $derived(
		product?.variants?.length > 0
			? Math.min(...product.variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
	);

	const hasMultipleVariants = $derived(product?.variants?.length > 1);

	let imageError = $state(false);
	let imageLoaded = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}
</script>

<div class="group relative bg-card overflow-hidden rounded-lg border border-border {className}">
	<!-- Image Section -->
	<div class="relative w-full h-full p-6">
		{#if imageError || !product?.images?.length}
			<div class="w-full h-full flex items-center justify-center bg-muted">
				<ImageOff class="h-10 w-10 text-muted-foreground" />
			</div>
		{:else}
			{#if !imageLoaded}
				<div class="absolute inset-0 p-6">
					<div class="h-full w-full animate-pulse bg-muted rounded-md"></div>
				</div>
			{/if}
			<img
				src={getOptimizedImageUrl(product.images[0]?.url || '')}
				alt={product.images[0]?.alt || product.name}
				loading="lazy"
				class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
				class:opacity-0={!imageLoaded}
				class:opacity-100={imageLoaded}
				onerror={handleImageError}
				onload={handleImageLoad}
			/>
		{/if}
	</div>

	<!-- Text Overlay (Dark theme style) -->
	<div class="absolute bottom-0 left-0 right-0 p-4">
		<h3 class="text-lg font-medium text-white truncate">
			{product?.name || 'Product Name'}
		</h3>
		<div class="flex items-baseline gap-2 mt-1">
			{#if hasMultipleVariants}
				<span class="text-xs text-white/70">
					{product_starting_at()}
				</span>
			{/if}
			<span class="text-xl font-bold text-white">
				{formatPrice(basePrice)}
			</span>
		</div>
	</div>

	<!-- Link Overlay -->
	<a
		href="/products/{product?.slug || ''}"
		class="absolute inset-0 z-10"
		aria-label={product_view_details({ name: product.name })}
	></a>
</div>
