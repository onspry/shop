<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { AppImage } from '$lib/components/ui/app-image';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';
	import { localizeHref, getLocale } from '$lib/paraglide/runtime';

	let { product, class: className = '' } = $props<{
		product: ProductViewModel;
		class?: string;
	}>();

	let isLoading = $state(false);

	// Get the current locale
	const currentLocale = $derived(getLocale());

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
	class="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-border/80 hover:shadow-md {className}"
>
	<!-- Image Section -->
	<div class="relative flex w-full items-center justify-center overflow-hidden p-4 pb-20">
		<div
			class="relative flex aspect-square h-[250px] w-full items-center justify-center overflow-hidden rounded-md"
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
		class="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-background/90 p-4 backdrop-blur-sm"
	>
		<h3 class="truncate">
			{product?.name || 'Product Name'}
		</h3>
		<div class="mt-2 flex items-center justify-between gap-2">
			<div class="flex items-baseline gap-2">
				{#if hasMultipleVariants}
					<span class="text-xs text-muted-foreground">
						{m.product_starting_at()}
					</span>
				{/if}
				<span class="text-xl font-bold text-foreground">
					{formatPrice(basePrice, currentLocale)}
				</span>
			</div>
			<Button
				href={localizeHref(`/products/${product?.slug || ''}`)}
				variant="default"
				size="sm"
				class="flex h-8 items-center justify-center gap-2 px-3 transition-colors hover:bg-primary/90"
				onclick={handleViewDetails}
				disabled={isLoading}
			>
				{#if isLoading}
					<span
						class="block h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
					></span>
					<span>{m.product_view_details()}</span>
				{:else}
					{m.product_view_details()}
				{/if}
			</Button>
		</div>
	</div>

	<!-- Link Overlay -->
	<a
		href={localizeHref(`/products/${product?.slug || ''}`)}
		class="absolute inset-0 z-10"
		aria-label={m.product_view_details({ name: product.name })}
		onclick={handleViewDetails}
		data-sveltekit-preload-data="hover"
	></a>
</div>
