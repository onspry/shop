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

	// Reference to store the autoplay plugin instance
	let autoplayInstance: any = null;

	// Create autoplay plugin for continuous sliding
	const createAutoplayPlugin = () => {
		const plugin = Autoplay({
			delay: 3000, // 3 seconds between transitions for a more relaxed pace
			stopOnInteraction: false, // Don't stop on normal interaction
			playOnInit: true // Start autoplay on initial load
		}) as AutoplayType;

		// Store the instance for later use
		autoplayInstance = plugin;
		return plugin;
	};

	// Function to handle mouse enter (pause)
	function handleMouseEnter() {
		if (autoplayInstance && typeof autoplayInstance.stop === 'function') {
			autoplayInstance.stop();
		}
	}

	// Function to handle mouse leave (resume)
	function handleMouseLeave() {
		if (autoplayInstance && typeof autoplayInstance.play === 'function') {
			autoplayInstance.play();
		}
	}

	// Carousel options for smoother experience
	const carouselOptions = {
		loop: true,
		align: "start" as const, // Type assertion for alignment
		skipSnaps: false,
		dragFree: true, // Allow free dragging for smoother feel
		startIndex: 0,
		containScroll: 'trimSnaps' as const, // Ensure proper alignment with type assertion
		duration: 1500 // Slower, smoother transitions (1.5 seconds)
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
	<div class="hidden sm:grid sm:grid-cols-3 gap-4 md:gap-6">
		<!-- Main product - takes up 2 columns -->
		<div class="col-span-2 min-h-[600px]">
			{#if mainProduct}
				<ProductCard product={mainProduct} class="h-full" />
			{/if}
		</div>

		<!-- Right accessory column - takes up 1 column -->
		<div class="flex flex-col gap-4 md:gap-6">
			<div class="flex-1 min-h-[290px]">
				{#if topAccessory}
					<ProductCard product={topAccessory} class="h-full" />
				{/if}
			</div>

			<div class="flex-1 min-h-[290px]">
				{#if bottomAccessory}
					<ProductCard product={bottomAccessory} class="h-full" />
				{/if}
			</div>
		</div>
	</div>

	<!-- Accessories Carousel -->
	<div class="mt-8 mb-6 md:mt-12">
		<h2 class="text-xl md:text-2xl font-bold mb-3 md:mb-4">More Accessories</h2>
		<div
			class="w-full"
			role="region"
			aria-label="Accessories carousel"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			<Carousel.Root
				plugins={[createAutoplayPlugin()]}
				opts={carouselOptions}
				class="w-full overflow-hidden hover-carousel"
			>
			<Carousel.Content class="-ml-4 md:-ml-6 flex transition-transform duration-500 ease-in-out">
				{#each accessories as product (product.id)}
					<Carousel.Item class="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 transition-opacity duration-300">
						<div class="p-2 h-[350px]">
							<ProductCard {product} class="h-full" />
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<div class="flex justify-center items-center mt-4">
				<div class="text-sm text-muted-foreground">
					Hover to pause • Scroll to browse
				</div>
			</div>
			</Carousel.Root>
		</div>
	</div>
</div>
