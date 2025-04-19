<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import { product_starting_at, product_view_details } from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ImageOff } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

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

<div class="group relative bg-card overflow-hidden rounded-lg border border-border hover:shadow-md transition-all duration-200 hover:border-border/80 {className}">
	<!-- Image Section -->
	<div class="relative w-full p-6 overflow-hidden flex items-center justify-center">
		<div class="relative aspect-square w-full max-w-full overflow-hidden bg-muted/5 rounded-md border border-border/50 group flex items-center justify-center">
			{#if imageError || !product?.images?.length}
				<div class="absolute inset-0 flex items-center justify-center bg-muted">
					<ImageOff class="h-10 w-10 text-muted-foreground" />
				</div>
			{:else}
				{#if !imageLoaded}
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="h-full w-full animate-pulse bg-muted-foreground/20"></div>
					</div>
				{/if}
				<img
					src={getOptimizedImageUrl(product.images[0]?.url || '')}
					alt={product.images[0]?.alt || product.name}
					loading="lazy"
					class="max-h-full max-w-full object-contain object-center transition-all duration-300 group-hover:scale-110"
					class:opacity-0={!imageLoaded}
					class:opacity-100={imageLoaded}
					onerror={handleImageError}
					onload={handleImageLoad}
				/>
			{/if}
		</div>
	</div>

	<!-- Text Overlay (Theme aware) -->
	<div class="absolute bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border/50">
		<h3 class="text-lg font-medium text-foreground truncate">
			{product?.name || 'Product Name'}
		</h3>
		<div class="flex items-center justify-between gap-2 mt-2">
			<div class="flex items-baseline gap-2">
				{#if hasMultipleVariants}
					<span class="text-xs text-muted-foreground">
						{product_starting_at()}
					</span>
				{/if}
				<span class="text-xl font-bold text-foreground">
					{formatPrice(basePrice)}
				</span>
			</div>
			<Button
				href="/products/{product?.slug || ''}"
				variant="default"
				size="sm"
				class="h-8 px-3 transition-colors hover:bg-primary/90"
			>
				{product_view_details({ name: product.name })}
			</Button>
		</div>
	</div>

	<!-- Link Overlay -->
	<a
		href="/products/{product?.slug || ''}"
		class="absolute inset-0 z-10"
		aria-label={product_view_details({ name: product.name })}
	></a>
</div>
