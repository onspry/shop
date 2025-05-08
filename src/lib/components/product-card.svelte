<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import { product_starting_at, product_view_details } from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { AppImage } from '$lib/components/ui/app-image';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';

	let { product, class: className = '' } = $props<{
		product: ProductViewModel;
		class?: string;
	}>();

	let isLoading = $state(false);

	const basePrice = $derived(
		product?.variants?.length > 0
			? Math.min(...product.variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
	);

	const hasMultipleVariants = $derived(product?.variants?.length > 1);

	function handleViewDetails() {
		isLoading = true;
		// The loading state will be cleared when navigation completes
		// due to SvelteKit's client-side navigation
	}
</script>

<div
	class="group relative bg-card overflow-hidden rounded-lg border border-border hover:shadow-md transition-all duration-200 hover:border-border/80 {className}"
>
	<!-- Image Section -->
	<div class="relative w-full p-4 pb-20 overflow-hidden flex items-center justify-center">
		<div
			class="relative aspect-square w-full h-[250px] overflow-hidden rounded-md flex items-center justify-center"
		>
			<AppImage
				src={product?.images?.length ? product.images[0].url : ''}
				alt={product?.images?.length ? product.images[0].alt : product?.name || 'Product'}
				width="100%"
				height="100%"
				aspectRatio="1/1"
				className="h-full w-full group-hover:scale-105 transition-all duration-300 mx-auto"
				objectFit="contain"
				showPlaceholder={true}
			/>
		</div>
	</div>

	<!-- Text Overlay (Theme aware) -->
	<div
		class="absolute bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border/50"
	>
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
				class="h-8 px-3 transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
				onclick={handleViewDetails}
				disabled={isLoading}
			>
				{#if isLoading}
					<span
						class="h-5 w-5 block animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
					></span>
					<span>View Details...</span>
				{:else}
					{product_view_details({ name: product.name })}
				{/if}
			</Button>
		</div>
	</div>

	<!-- Link Overlay -->
	<a
		href="/products/{product?.slug || ''}"
		class="absolute inset-0 z-10"
		aria-label={product_view_details({ name: product.name })}
		onclick={handleViewDetails}
	></a>
</div>
