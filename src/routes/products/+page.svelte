<script lang="ts">
	import ProductCard from '$lib/components/product-card.svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CatalogueViewModel } from '$lib/models/catalogue';
	import type { ProductViewModel } from '$lib/models/product';
	import Autoplay from 'embla-carousel-autoplay';
	import type { AutoplayType } from 'embla-carousel-autoplay';
	import { onMount } from 'svelte';

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
	const mainProduct = $derived(getProductByCategory('KEYBOARD') || getFallbackProduct(0));
	const topAccessory = $derived(getProductByCategory('SWITCH') || getFallbackProduct(1));
	const bottomAccessory = $derived(getProductByCategory('KEYCAP') || getFallbackProduct(2));

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

	// Create an autoplay plugin with continuous movement
	const autoplayPlugin = Autoplay({
		delay: 2000,
		stopOnInteraction: false,
		playOnInit: true
	}) as AutoplayType;
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
	<div class="hidden sm:flex sm:flex-row gap-4 md:gap-6">
		<!-- Main product -->
		<div class="w-2/3">
			{#if mainProduct}
				<div class="aspect-[4/3] w-full h-full">
					<ProductCard product={mainProduct} class="h-full" />
				</div>
			{/if}
		</div>

		<!-- Right accessory column - sized to match height of main product exactly -->
		<div class="w-1/3 flex flex-col gap-4 md:gap-6">
			<div class="flex-1">
				{#if topAccessory}
					<ProductCard product={topAccessory} class="h-full" />
				{/if}
			</div>

			<div class="flex-1">
				{#if bottomAccessory}
					<ProductCard product={bottomAccessory} class="h-full" />
				{/if}
			</div>
		</div>
	</div>

	<!-- Accessories Carousel -->
	<div class="mt-8 mb-6 md:mt-12">
		<h2 class="text-xl md:text-2xl font-bold mb-3 md:mb-4">More Accessories</h2>
		<Carousel.Root>
			<Carousel.Content class="-ml-4">
				{#each accessories as product (product.id)}
					<Carousel.Item class="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
						<div class="p-2 aspect-[1/1.2] w-full">
							<ProductCard {product} />
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous />
			<Carousel.Next />
		</Carousel.Root>
	</div>
</div>
