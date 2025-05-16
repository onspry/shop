<script lang="ts">
	import ProductCard from '$lib/components/product-card.svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CatalogueViewModel } from '$lib/models/catalogue';
	import type { ProductViewModel } from '$lib/models/product';
	import Autoplay from 'embla-carousel-autoplay';
	import type { AutoplayType } from 'embla-carousel-autoplay';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import PriceDisplay from '$lib/components/PriceDisplay.svelte';

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

<div
	class="transition-opacity duration-500"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	<!-- Mobile view (stacked layout) -->
	<div class="grid grid-cols-1 gap-4 sm:hidden">
		{#if mainProduct}
			<div class="aspect-square w-full">
				<ProductCard product={mainProduct} class="h-full" />
			</div>
		{/if}

		{#if topAccessory}
			<div class="aspect-square w-full">
				<ProductCard product={topAccessory} class="h-full" />
			</div>
		{/if}

		{#if bottomAccessory}
			<div class="aspect-square w-full">
				<ProductCard product={bottomAccessory} class="h-full" />
			</div>
		{/if}
	</div>

	<!-- Desktop layout with right cards matching left card height -->
	<div class="hidden gap-4 sm:grid sm:grid-cols-3 md:gap-6">
		<!-- Main product - takes up 2 columns -->
		<div class="col-span-2 min-h-[600px]">
			{#if mainProduct}
				<ProductCard product={mainProduct} class="h-full" />
			{/if}
		</div>

		<!-- Right accessory column - takes up 1 column -->
		<div class="flex flex-col gap-4 md:gap-6">
			<div class="min-h-[290px] flex-1">
				{#if topAccessory}
					<ProductCard product={topAccessory} class="h-full" />
				{/if}
			</div>

			<div class="min-h-[290px] flex-1">
				{#if bottomAccessory}
					<ProductCard product={bottomAccessory} class="h-full" />
				{/if}
			</div>
		</div>
	</div>

	<!-- Accessories Carousel -->
	<div class="mb-6 mt-8 md:mt-12">
		<h2 class="mb-3 text-xl font-bold md:mb-4 md:text-2xl">{m.product_more_accessories()}</h2>
		<div class="w-full" role="region" aria-label={m.aria_accessories_carousel()}>
			<Carousel.Root
				plugins={[createAutoplayPlugin()]}
				opts={carouselOptions}
				class="w-full overflow-hidden"
			>
				<Carousel.Content
					class="duration-30000 -ml-4 flex transition-transform ease-linear md:-ml-6"
				>
					{#each accessories as product (product.id)}
						<Carousel.Item
							class="pl-4 transition-opacity duration-1000 md:basis-1/2 md:pl-6 lg:basis-1/3 xl:basis-1/4"
						>
							<div class="h-[350px] p-2">
								<ProductCard {product} class="h-full" />
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		</div>
	</div>
</div>
