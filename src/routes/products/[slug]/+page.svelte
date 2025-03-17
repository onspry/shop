<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { Product, ProductVariant, ProductImage } from '$lib/server/db/schema';
	import { onMount } from 'svelte';
	import ProductDetailKeyboard from '$lib/components/product-detail-keyboard.svelte';
	import ProductDetailAccessory from '$lib/components/product-detail-accessory.svelte';
	import * as productStore from '$lib/stores/products';

	let { data } = $props<{ data: PageData }>();

	// Log the product data for debugging
	// console.log('Product data:', data.product);
	// console.log('Category:', data.product.category);
	// console.log('Variants:', data.product.variants);
	// console.log('Accessory Products:', data.accessoryProducts);
	// console.log('Accessory Variants:', data.accessoryVariants);

	// Load the data into the store for persistence
	onMount(() => {
		if (data.product?.category?.toUpperCase() === 'KEYBOARD') {
			productStore.loadKeyboardWithAccessories(
				data.product,
				data.variants,
				data.images,
				data.accessoryProducts,
				data.accessoryVariants,
				data.accessoryImages
			);
		} else {
			// For non-keyboard products, just add them to the store
			productStore.addProduct(data.product);
			productStore.addVariants(data.variants);
			productStore.addImages(data.images);
		}
	});

	// Determine which component to use based on the product category
	const productCategory = data.product.category.toUpperCase();

	// Ensure product data is properly typed
	const product = data.product as Product;
	const variants = data.product.variants as ProductVariant[];
	const images = data.product.images as ProductImage[];
</script>

<div class="min-h-screen bg-background">
	<div class="container py-12">
		{#if !data.product}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		{:else if productCategory === 'KEYBOARD'}
			<ProductDetailKeyboard
				product={data.product}
				variants={data.variants}
				images={data.images}
				accessoryProducts={data.accessoryProducts}
				accessoryVariants={data.accessoryVariants}
				accessoryImages={data.accessoryImages}
			/>
		{:else}
			<ProductDetailAccessory
				product={data.product}
				variants={data.variants}
				images={data.images}
			/>
		{/if}
	</div>
</div>
