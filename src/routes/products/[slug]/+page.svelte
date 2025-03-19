<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';
	import { onMount } from 'svelte';
	import ProductDetailKeyboard from '$lib/components/product-detail-keyboard.svelte';
	import ProductDetailAccessory from '$lib/components/product-detail-accessory.svelte';
	import * as productStore from '$lib/stores/products';

	interface CompatibilityResult {
		product: Product;
		variants: ProductVariant[];
		images: ProductImage[];
	}

	let { data } = $props<{ data: PageData }>();

	// Derive product category safely
	const productCategory = $derived(data?.product?.category?.toUpperCase() ?? '');

	// Safely prepare keyboard props with proper null checks and defaults
	const keyboardProps = $derived({
		product: data?.product ?? null,
		variants: Array.isArray(data?.variants) ? data.variants : [],
		images: Array.isArray(data?.images) ? data.images : [],
		requiredAccessories: data?.requiredAccessories ?? {},
		optionalAccessories: data?.optionalAccessories ?? {},
		requiredAccessoryCategories: Array.isArray(data?.requiredAccessoryCategories)
			? data.requiredAccessoryCategories
			: [],
		optionalAccessoryCategories: Array.isArray(data?.optionalAccessoryCategories)
			? data.optionalAccessoryCategories
			: []
	});

	// Debug logging with safe access
	$effect(() => {
		if (data?.product?.category === 'KEYBOARD') {
			console.log('Keyboard product data:', {
				product: data.product
					? {
							id: data.product.id,
							name: data.product.name,
							category: data.product.category
						}
					: null,
				variants: data?.variants?.length ?? 0,
				requiredAccessories: Object.fromEntries(
					Object.entries(data?.requiredAccessories ?? {}).map(([k, v]) => [
						k,
						Array.isArray(v) ? v.length : 0
					])
				),
				optionalAccessories: Object.fromEntries(
					Object.entries(data?.optionalAccessories ?? {}).map(([k, v]) => [
						k,
						Array.isArray(v) ? v.length : 0
					])
				),
				requiredCategories: data?.requiredAccessoryCategories ?? [],
				optionalCategories: data?.optionalAccessoryCategories ?? []
			});

			// Add detailed logging for optional accessories
			if (data?.optionalAccessories) {
				console.log(
					'Optional accessories details:',
					Object.entries(data.optionalAccessories).map(([category, accessories]) => {
						const typedAccessories = accessories as CompatibilityResult[];
						return {
							category,
							count: typedAccessories.length,
							accessories: typedAccessories.map((a: CompatibilityResult) => ({
								name: a.product.name,
								variants: a.variants.map((v: ProductVariant) => ({
									name: v.name,
									attributes: v.attributes
								}))
							}))
						};
					})
				);
			}
		}
	});

	// Helper function to extract products, variants, and images from compatibility results
	function extractFromCompatibilityResults(results: Record<string, CompatibilityResult[]>) {
		const products: Product[] = [];
		const variants: ProductVariant[] = [];
		const images: ProductImage[] = [];

		Object.values(results).forEach((categoryResults) => {
			categoryResults.forEach((result) => {
				products.push(result.product);
				variants.push(...result.variants);
				images.push(...result.images);
			});
		});

		return { products, variants, images };
	}

	// Load data into store with proper null checks
	onMount(() => {
		if (!data?.product) return;

		if (data.product.category?.toUpperCase() === 'KEYBOARD') {
			// Extract accessories data
			const required = extractFromCompatibilityResults(data.requiredAccessories ?? {});
			const optional = extractFromCompatibilityResults(data.optionalAccessories ?? {});

			// Combine all accessory data
			const accessories = [...required.products, ...optional.products];
			const accessoryVariants = [...required.variants, ...optional.variants];
			const accessoryImages = [...required.images, ...optional.images];

			productStore.loadKeyboardWithAccessories(
				data.product,
				data.variants ?? [],
				data.images ?? [],
				accessories,
				accessoryVariants,
				accessoryImages
			);
		} else {
			productStore.addProduct(data.product);
			if (Array.isArray(data.variants)) productStore.addVariants(data.variants);
			if (Array.isArray(data.images)) productStore.addImages(data.images);
		}
	});
</script>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-8">
		{#if !data?.product}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		{:else if productCategory === 'KEYBOARD'}
			<ProductDetailKeyboard {...keyboardProps} />
		{:else}
			<ProductDetailAccessory
				product={data.product}
				variants={Array.isArray(data.variants) ? data.variants : []}
				images={Array.isArray(data.images) ? data.images : []}
			/>
		{/if}
	</div>
</div>
