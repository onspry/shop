<script lang="ts">
	import ProductCard from '$lib/components/product-card.svelte';
	import type { CatalogueViewModel } from '$lib/models/catalogue';
	import type { ProductViewModel } from '$lib/models/product';
	import Autoplay from 'embla-carousel-autoplay';
	import type { AutoplayType } from 'embla-carousel-autoplay';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let { data } = $props<{ data: { catalogue: CatalogueViewModel } }>();

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);

		return () => clearTimeout(timer);
	});

	function getProductByCategory(category: string, index: number = 0): ProductViewModel | null {
		const group = data?.catalogue?.productGroups?.find(
			(g: { category?: string | null }) =>
				(g.category || '').toUpperCase() === category.toUpperCase()
		);
		return group?.products?.[index] || null;
	}

	function getFallbackProduct(index: number = 0): ProductViewModel | null {
		return data?.catalogue?.productGroups?.[0]?.products?.[index] || null;
	}

	// Get products for the layout, falling back if specific categories aren't found
	const mainProduct = $derived(
		getProductByCategory(m.category_keyboard()) || getFallbackProduct(0)
	);
	const topAccessory = $derived(getProductByCategory(m.category_switch()) || getFallbackProduct(1));
	const bottomAccessory = $derived(
		getProductByCategory(m.category_keycap()) || getFallbackProduct(2)
	);

	// Get all accessories for the carousel
	let accessories = $state<ProductViewModel[]>([]);
	$effect(() => {
		const allProducts =
			data?.catalogue?.productGroups?.flatMap(
				(group: { products?: ProductViewModel[] }) => group.products || []
			) || [];

		// Filter out the main product (keyboard) to show only accessories
		accessories = allProducts.filter(
			(product: ProductViewModel) => product?.id !== mainProduct?.id && product?.id !== undefined
		);
	});

	// Create autoplay plugin for very slow continuous sliding from right to left
	const createAutoplayPlugin = () => {
		return Autoplay({
			delay: 10, // Extremely short delay for near-continuous movement
			stopOnInteraction: false, // Don't stop on interaction
			playOnInit: true, // Start autoplay on initial load
			jump: false // Prevent jumping during transitions
		}) as AutoplayType;
	};

	// Carousel options for extremely smooth, continuous movement
	const carouselOptions = {
		loop: true,
		align: 'start' as const, // Start alignment for more predictable movement
		skipSnaps: false, // Don't skip snap points for more predictable movement
		dragFree: true, // Enable free dragging for smoother transitions
		startIndex: 0,
		containScroll: 'trimSnaps' as const, // Trim snaps for smoother looping
		duration: 30000, // Extremely slow transitions (30 seconds)
		slidesToScroll: 1, // Move one slide at a time
		speed: 0.1 // Very slow speed factor
	};
</script>

<a
	href="#main-products"
	class="sr-only absolute left-2 top-2 z-50 rounded bg-orange-500 px-4 py-2 text-white focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-orange-400"
>
	Skip to products
</a>

<div class="py-8 md:py-12">
	<!-- Main Products Section -->
	{#snippet productGrid(products: ProductViewModel[])}
		{@const productCount = products?.length || 0}
		{@const gridCols =
			productCount === 1
				? 'grid-cols-1'
				: productCount === 2
					? 'grid-cols-1 sm:grid-cols-2'
					: productCount === 3
						? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
						: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}

		{#if productCount === 1}
			<section class="mb-12 w-full md:mb-16" id="main-products">
				<header class="mb-6 md:mb-8">
					<h2>Our Products</h2>
				</header>
				<div class="grid gap-6 {gridCols}">
					{#each products as product (product.id)}
						<article class="flex h-full flex-col" aria-labelledby={'product-title-' + product.id}>
							<ProductCard {product} class="flex h-full flex-col" {productCount} />
						</article>
					{/each}
				</div>
			</section>
		{:else}
			<section class="layout-container mb-12 md:mb-16" id="main-products">
				<header class="mb-6 md:mb-8">
					<h2>Our Products</h2>
				</header>
				<div class="grid gap-6 {gridCols}">
					{#each products as product (product.id)}
						<article class="flex h-full flex-col" aria-labelledby={'product-title-' + product.id}>
							<ProductCard {product} class="flex h-full flex-col" {productCount} />
						</article>
					{/each}
				</div>
			</section>
		{/if}
	{/snippet}

	{@render productGrid(
		data.catalogue.productGroups
			?.filter(
				(group: { category?: string | null }) =>
					(group.category || '').toUpperCase() === m.category_keyboard().toUpperCase()
			)
			.flatMap((g: { products?: ProductViewModel[] }) => g.products || []) || []
	)}

	<!-- Accessories Carousel Section -->
	<section class="mb-12 md:mb-16" id="accessories">
		<header class="mb-6 md:mb-8">
			<h2>{m.product_accessories()}</h2>
		</header>

		{#if accessories.length <= 2}
			<!-- Grid layout for 1-2 accessories -->
			{@const accessoryCount = accessories.length}

			<div class="flex flex-col gap-6">
				{#each accessories as product, index (product.id)}
					<article class="flex h-full flex-col" aria-labelledby={'accessory-title-' + product.id}>
						<ProductCard
							{product}
							class="flex h-full flex-col"
							productCount={1}
							imagePosition={index % 2 === 0 ? 'right' : 'left'}
						/>
					</article>
				{/each}
			</div>
		{:else}
			<!-- Carousel layout for 3+ accessories -->
			<div class="w-full" role="region" aria-label={m.aria_accessories_carousel()}>
				{#each accessories as product (product.id)}
					<div class="h-[350px] p-2">
						<ProductCard {product} class="h-full" />
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
