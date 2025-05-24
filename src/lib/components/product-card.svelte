<!-- ProductCard.svelte -->
<script lang="ts">
	import type { ProductViewModel, ProductVariantViewModel } from '$lib/models/product';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { AppImage } from '$lib/components/ui/app-image';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';
	import { localizeHref, getLocale } from '$lib/paraglide/runtime';

	let {
		product,
		class: className = '',
		productCount = 4,
		imagePosition = 'left'
	} = $props<{
		product: ProductViewModel;
		class?: string;
		productCount?: number;
		imagePosition?: 'left' | 'right';
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
	}

	// Example badge logic (customize as needed)
	const isNew = product?.isNew || false;
	const isLowStock = product?.stockQuantity !== undefined && product.stockQuantity < 10;
	const hasDiscount = product?.discountPrice && product.discountPrice < basePrice;

	// Determine if this should use hero layout (when there's only 1 product)
	const useHeroLayout = $derived(productCount === 1);
</script>

{#if useHeroLayout}
	<!-- Hero Layout (Full Width) -->
	<div
		class="group relative flex w-full flex-col rounded-2xl border border-muted/60 bg-background/80 shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md lg:gap-0 {imagePosition ===
		'left'
			? 'lg:flex-row'
			: 'lg:flex-row-reverse'} {className}"
	>
		<!-- Image Section - Takes up majority of left/right side -->
		<div
			class="relative flex w-full overflow-hidden bg-gradient-to-br from-muted/40 to-background/80 lg:w-3/5 xl:w-2/3 {imagePosition ===
			'left'
				? 'rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none'
				: 'rounded-t-2xl lg:rounded-r-2xl lg:rounded-tl-none'}"
		>
			{#if product?.images?.length}
				<AppImage
					src={product.images[0].url}
					alt={product.images[0].alt || product?.name || 'Product'}
					width="100%"
					height="100%"
					aspectRatio="auto"
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					objectFit="cover"
					showPlaceholder={true}
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground"
				>
					<span>No Image</span>
				</div>
			{/if}
			{#if isNew}
				<span
					class="absolute left-3 top-3 rounded bg-orange-500 px-2 py-1 text-xs font-bold text-white shadow"
					>New</span
				>
			{/if}
			{#if isLowStock}
				<span
					class="absolute right-3 top-3 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white shadow"
					>Low Stock</span
				>
			{/if}
		</div>

		<!-- Content Section - Takes up remaining right side -->
		<div class="flex flex-1 flex-col justify-center p-8 lg:w-2/5 lg:p-12 xl:w-1/3">
			<div class="mb-6 lg:mb-8">
				<h3 class="mb-4 text-2xl font-bold text-foreground lg:text-3xl xl:text-4xl">
					{product?.name || 'Product Name'}
				</h3>
				<div class="flex items-baseline gap-3 lg:gap-4">
					{#if hasMultipleVariants}
						<span class="text-base text-muted-foreground lg:text-lg">{m.product_starting_at()}</span
						>
					{/if}
					{#if hasDiscount}
						<span class="text-2xl font-bold text-primary lg:text-3xl xl:text-4xl"
							>{formatPrice(product.discountPrice, currentLocale)}</span
						>
						<span class="text-lg text-muted-foreground line-through lg:text-xl"
							>{formatPrice(basePrice, currentLocale)}</span
						>
					{:else}
						<span class="text-2xl font-bold text-primary lg:text-3xl xl:text-4xl"
							>{formatPrice(basePrice, currentLocale)}</span
						>
					{/if}
				</div>
			</div>

			<!-- Description -->
			{#if product?.description}
				<div class="mb-6 lg:mb-8">
					<p class="text-base leading-relaxed text-muted-foreground lg:text-lg">
						{product.description}
					</p>
				</div>
			{/if}

			<!-- Key Features -->
			{#if product?.features && product.features.length > 0}
				<div class="mb-6 lg:mb-8">
					<h4 class="mb-3 text-lg font-semibold text-foreground lg:text-xl">
						{m.product_features()}
					</h4>
					<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each product.features.slice(0, 6) as feature}
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
								<span class="text-sm text-foreground lg:text-base">{feature}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<Button
				href={localizeHref(`/products/${product?.slug || ''}`)}
				variant="default"
				size="lg"
				class="w-full rounded-lg bg-orange-500 py-4 text-lg font-semibold text-white shadow transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 lg:w-auto lg:px-8 lg:py-5 lg:text-xl"
				onclick={handleViewDetails}
				disabled={isLoading}
			>
				{#if isLoading}
					<span
						class="block h-6 w-6 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent lg:h-7 lg:w-7"
					></span>
					<span>{m.product_view_details()}</span>
				{:else}
					{m.product_view_details()}
				{/if}
			</Button>
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
{:else}
	<!-- Standard Layout (Multiple Products) -->
	<div
		class="group relative flex flex-col rounded-2xl border border-muted/60 bg-background/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md {className}"
	>
		<!-- Image Section -->
		<div
			class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-muted/40 to-background/80"
		>
			{#if product?.images?.length}
				<AppImage
					src={product.images[0].url}
					alt={product.images[0].alt || product?.name || 'Product'}
					width="100%"
					height="100%"
					aspectRatio="4/3"
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					objectFit="cover"
					showPlaceholder={true}
				/>
			{:else}
				<div
					class="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground"
				>
					<span>No Image</span>
				</div>
			{/if}
			{#if isNew}
				<span
					class="absolute left-3 top-3 rounded bg-orange-500 px-2 py-1 text-xs font-bold text-white shadow"
					>New</span
				>
			{/if}
			{#if isLowStock}
				<span
					class="absolute right-3 top-3 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white shadow"
					>Low Stock</span
				>
			{/if}
		</div>

		<!-- Card Content -->
		<div class="flex flex-1 flex-col justify-between p-6 lg:p-8">
			<div class="mb-4 lg:mb-6">
				<h3 class="mb-2 line-clamp-2 text-lg font-semibold text-foreground lg:text-xl">
					{product?.name || 'Product Name'}
				</h3>
				<div class="flex items-center gap-2 lg:gap-3">
					{#if hasMultipleVariants}
						<span class="text-sm text-muted-foreground lg:text-base">{m.product_starting_at()}</span
						>
					{/if}
					{#if hasDiscount}
						<span class="text-xl font-bold text-primary lg:text-2xl"
							>{formatPrice(product.discountPrice, currentLocale)}</span
						>
						<span class="text-base text-muted-foreground line-through lg:text-lg"
							>{formatPrice(basePrice, currentLocale)}</span
						>
					{:else}
						<span class="text-xl font-bold text-primary lg:text-2xl"
							>{formatPrice(basePrice, currentLocale)}</span
						>
					{/if}
				</div>
			</div>
			<Button
				href={localizeHref(`/products/${product?.slug || ''}`)}
				variant="default"
				size="lg"
				class="w-full rounded-lg bg-orange-500 py-3 text-base font-semibold text-white shadow transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 lg:py-4 lg:text-lg"
				onclick={handleViewDetails}
				disabled={isLoading}
			>
				{#if isLoading}
					<span
						class="block h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent lg:h-6 lg:w-6"
					></span>
					<span>{m.product_view_details()}</span>
				{:else}
					{m.product_view_details()}
				{/if}
			</Button>
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
{/if}
