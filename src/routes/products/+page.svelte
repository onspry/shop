<script lang="ts">
	import type { PageData } from './$types';
	import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';
	import {
		product_section_keyboard,
		product_section_accessories,
		product_view_details
	} from '$lib/paraglide/messages';
	import ProductCard from '$lib/components/product-card.svelte';
	import * as productStore from '$lib/stores/products';
	import { onMount } from 'svelte';

	interface PageDataWithProducts extends PageData {
		products: (Product & {
			variants: ProductVariant[];
			images: ProductImage[];
		})[];
	}

	let { data } = $props<{ data: PageDataWithProducts }>();

	// Initialize the store with data from the page load function
	onMount(() => {
		if (data.products) {
			// console.log('Products from server:', data.products);
			// Extract flat arrays of products, variants, and images
			const products = data.products.map(
				(
					p: Product & {
						variants: ProductVariant[];
						images: ProductImage[];
					}
				) => ({
					id: p.id,
					slug: p.slug,
					category: p.category,
					name: p.name,
					description: p.description,
					features: p.features,
					specifications: p.specifications,
					isAccessory: p.isAccessory,
					createdAt: p.createdAt,
					updatedAt: p.updatedAt
				})
			);

			const variants: ProductVariant[] = [];
			const images: ProductImage[] = [];

			data.products.forEach(
				(
					p: Product & {
						variants: ProductVariant[];
						images: ProductImage[];
					}
				) => {
					if (p.variants) variants.push(...p.variants);
					if (p.images) images.push(...p.images);
				}
			);

			// console.log('Processed products:', products);
			// console.log('Processed variants:', variants);
			// console.log('Processed images:', images);

			productStore.setProducts(products);
			productStore.setVariants(variants);
			productStore.setImages(images);
		}
	});

	// Subscribe to the stores
	let keyboardProduct = $state<Product | undefined>(undefined);
	let accessories = $state<Product[]>([]);
	let accessoryCategories = $state<[string, Product[]][]>([]);
	let allVariants = $state<ProductVariant[]>([]);

	productStore.keyboardProduct.subscribe((value) => {
		keyboardProduct = value;
		console.log('Keyboard product:', keyboardProduct);
	});

	productStore.accessories.subscribe((value) => {
		accessories = value;
		console.log('Accessories:', accessories);
	});

	productStore.accessoryCategories.subscribe((value) => {
		accessoryCategories = value;
		console.log('Accessory categories:', accessoryCategories);
	});

	productStore.variants.subscribe((value) => {
		allVariants = value;
		console.log('All variants:', allVariants);
	});

	// Group variants by category
	const getVariantsByCategory = (category: string) => {
		const productsInCategory = accessories.filter((p) => p.category === category);
		const productIds = productsInCategory.map((p) => p.id);
		const filteredVariants = allVariants.filter((v) => productIds.includes(v.productId));
		console.log(`Variants for category ${category}:`, filteredVariants);
		return filteredVariants;
	};

	// Helper function to get variant attribute value
	const getVariantAttribute = (variant: ProductVariant, key: string): string => {
		try {
			const attributes = variant.attributes as Record<string, string>;
			return attributes[key] || '';
		} catch (e) {
			return '';
		}
	};

	// Helper function to get color class based on switch type
	const getSwitchColorClass = (variant: ProductVariant): string => {
		const color = getVariantAttribute(variant, 'color')?.toLowerCase() || '';

		switch (color) {
			case 'red':
				return 'bg-red-500';
			case 'blue':
				return 'bg-blue-500';
			case 'brown':
				return 'bg-amber-700';
			default:
				return 'bg-gray-500';
		}
	};

	// Helper function to get switch type icon/display
	const getSwitchTypeDisplay = (variant: ProductVariant): string => {
		const type = getVariantAttribute(variant, 'type')?.toLowerCase() || '';

		switch (type) {
			case 'linear':
				return '→';
			case 'tactile':
				return '↗';
			case 'clicky':
				return '↑';
			default:
				return '•';
		}
	};
</script>

<div class="min-h-screen bg-background">
	<div class="container py-12">
		{#if !data.products || data.products.length === 0}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		{:else}
			{#if keyboardProduct}
				<section class="mb-16">
					<h2 class="text-4xl font-bold tracking-tight text-foreground mb-8">
						{product_section_keyboard()}
					</h2>
					<div class="rounded-lg border bg-card text-card-foreground shadow">
						<div class="p-6">
							<ProductCard
								product={keyboardProduct}
								variants={productStore.getProductVariants(keyboardProduct.id)}
								images={productStore.getProductImages(keyboardProduct.id)}
							/>
						</div>
					</div>
				</section>
			{/if}

			{#if accessories.length > 0}
				<section class="space-y-8">
					<h2 class="text-4xl font-bold tracking-tight text-foreground">
						{product_section_accessories()}
					</h2>
					{#each accessoryCategories as [category, products]}
						<div class="rounded-lg border bg-card text-card-foreground shadow">
							<div class="p-6">
								<h3
									class="text-2xl font-semibold tracking-tight text-foreground mb-6 pb-4 border-b"
								>
									{category}
								</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{#each getVariantsByCategory(category) as variant}
										<div class="rounded-lg p-4">
											{#if products.find((p) => p.id === variant.productId)}
												{@const product = products.find((p) => p.id === variant.productId)}
												<div
													class="group relative bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
												>
													<div class="relative h-48 overflow-hidden">
														<div class="w-full h-full flex items-center justify-center bg-muted">
															{#if category === 'SWITCHES'}
																<div class="flex flex-col items-center justify-center">
																	<div class="relative w-24 h-24 mb-2">
																		<div class="absolute inset-0 flex items-center justify-center">
																			<div
																				class={`w-16 h-16 ${getSwitchColorClass(variant)} rounded-md shadow-lg flex items-center justify-center text-white font-bold text-xl`}
																			>
																				{getSwitchTypeDisplay(variant)}
																			</div>
																		</div>
																		<div
																			class="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 rounded-b-md"
																		></div>
																	</div>
																	<span class="text-sm font-medium"
																		>{getVariantAttribute(variant, 'type') || 'Switch'}</span
																	>
																</div>
															{:else if category === 'KEYCAPS'}
																<div class="flex flex-col items-center justify-center">
																	<div class="grid grid-cols-3 gap-1 mb-2">
																		{#each Array(9) as _, i}
																			<div
																				class="w-8 h-8 bg-gray-800 rounded-sm shadow-md flex items-center justify-center text-white text-xs"
																			>
																				{getVariantAttribute(variant, 'legend_type') === 'Blank'
																					? ''
																					: getVariantAttribute(variant, 'legend_type') === 'Dots'
																						? '•'
																						: String.fromCharCode(65 + i)}
																			</div>
																		{/each}
																	</div>
																	<span class="text-sm font-medium"
																		>{getVariantAttribute(variant, 'legend_type') || 'Keycap'}</span
																	>
																</div>
															{:else}
																<div
																	class="w-32 h-32 bg-gray-300 rounded-md flex items-center justify-center"
																>
																	<span class="text-gray-600">{category}</span>
																</div>
															{/if}
														</div>
													</div>

													<div class="p-4">
														<div class="mb-2">
															<span class="text-xs font-medium text-muted-foreground uppercase">
																{category}
															</span>
														</div>

														<h3 class="text-lg font-semibold text-foreground mb-2">
															{variant.name}
														</h3>

														<div class="flex items-baseline mb-2">
															<span class="text-xl font-bold text-foreground">
																${(Number(variant.price) / 100).toFixed(2)}
															</span>
														</div>

														{#if category === 'SWITCHES'}
															<div class="grid grid-cols-2 gap-2 mb-4 text-sm">
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Type</span>
																	<span>{getVariantAttribute(variant, 'type') || 'N/A'}</span>
																</div>
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Force</span>
																	<span
																		>{getVariantAttribute(variant, 'actuation_force') ||
																			'N/A'}</span
																	>
																</div>
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Feel</span>
																	<span>{getVariantAttribute(variant, 'feel') || 'N/A'}</span>
																</div>
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Color</span>
																	<span>{getVariantAttribute(variant, 'color') || 'N/A'}</span>
																</div>
															</div>
														{:else if category === 'KEYCAPS'}
															<div class="grid grid-cols-2 gap-2 mb-4 text-sm">
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Legend</span>
																	<span>{getVariantAttribute(variant, 'legend_type') || 'N/A'}</span
																	>
																</div>
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Material</span>
																	<span>{getVariantAttribute(variant, 'material') || 'N/A'}</span>
																</div>
																<div class="flex flex-col">
																	<span class="text-muted-foreground">Color</span>
																	<span>{getVariantAttribute(variant, 'color') || 'N/A'}</span>
																</div>
															</div>
														{:else}
															<p class="text-sm text-muted-foreground line-clamp-2 mb-4">
																{product?.description || ''}
															</p>
														{/if}

														<div class="flex justify-between items-center">
															<button
																class="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-300 w-full"
																onclick={() =>
																	(window.location.href = `/products/${product?.slug}`)}
															>
																{product_view_details()}
															</button>
														</div>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</section>
			{/if}
		{/if}
	</div>
</div>
