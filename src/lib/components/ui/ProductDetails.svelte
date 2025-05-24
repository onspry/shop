<script lang="ts">
	let { product } = $props<{ product: any }>();
	import * as m from '$lib/paraglide/messages';
	import { AppImage } from '$lib/components/ui/app-image';
	import { formatPrice } from '$lib/utils/price';
	import { getLocale } from '$lib/paraglide/runtime';

	// Get the current locale for price formatting
	const currentLocale = $derived(getLocale());

	// Get the main product image
	const mainImage = $derived(product?.images?.[0]);

	// Calculate pricing
	const basePrice = $derived(
		product?.variants?.length > 0
			? Math.min(...product.variants.map((v: any) => Number(v.price)))
			: product?.price || 0
	);

	const hasMultipleVariants = $derived(product?.variants?.length > 1);
	const hasDiscount = product?.discountPrice && product.discountPrice < basePrice;
</script>

<section class="layout-container py-12 md:py-16 lg:py-20">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-20">
		<!-- Image Section -->
		<div class="relative">
			<div
				class="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-muted/40 to-background/80 shadow-lg"
			>
				{#if mainImage}
					<AppImage
						src={mainImage.url}
						alt={mainImage.alt || product?.name || 'Product'}
						width="100%"
						height="100%"
						aspectRatio="4/3"
						className="h-full w-full object-cover"
						objectFit="cover"
						showPlaceholder={true}
					/>
				{:else}
					<div
						class="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground"
					>
						<span class="text-lg">No Image Available</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Content Section -->
		<div class="flex flex-col justify-center space-y-6 lg:space-y-8">
			<header class="space-y-4">
				<h1 class="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
					{product.name}
				</h1>

				<!-- Pricing -->
				<div class="flex items-baseline gap-3">
					{#if hasMultipleVariants}
						<span class="text-base text-muted-foreground md:text-lg">{m.product_starting_at()}</span
						>
					{/if}
					{#if hasDiscount}
						<span class="text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
							{formatPrice(product.discountPrice, currentLocale)}
						</span>
						<span class="text-lg text-muted-foreground line-through md:text-xl">
							{formatPrice(basePrice, currentLocale)}
						</span>
					{:else}
						<span class="text-2xl font-bold text-primary md:text-3xl lg:text-4xl">
							{formatPrice(basePrice, currentLocale)}
						</span>
					{/if}
				</div>
			</header>

			<!-- Description -->
			{#if product.description}
				<div class="prose prose-lg max-w-none">
					<p class="text-base leading-relaxed text-muted-foreground md:text-lg">
						{product.description}
					</p>
				</div>
			{/if}

			<!-- Key Features Highlight -->
			{#if product.features && product.features.length > 0}
				<div class="space-y-3">
					<h3 class="text-lg font-semibold text-foreground md:text-xl">
						{m.product_features()}
					</h3>
					<ul class="grid grid-cols-1 gap-2 md:grid-cols-2">
						{#each product.features.slice(0, 6) as feature}
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></span>
								<span class="text-sm text-foreground md:text-base">{feature}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Quick Specs -->
			{#if product.specifications && Object.keys(product.specifications).length > 0}
				<div class="space-y-3">
					<h3 class="text-lg font-semibold text-foreground md:text-xl">
						{m.product_specifications()}
					</h3>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each Object.entries(product.specifications).slice(0, 4) as [key, value]}
							<div class="flex justify-between rounded-lg bg-muted/30 px-3 py-2">
								<span class="text-sm font-medium text-muted-foreground">{key}</span>
								<span class="text-sm text-foreground">{value}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
