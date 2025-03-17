<script lang="ts">
	import type { PageData } from './$types';
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db/schema';
	import ProductDetailKeyboard from '$lib/components/product-detail-keyboard.svelte';
	import ProductDetailAccessory from '$lib/components/product-detail-accessory.svelte';
	import * as productStore from '$lib/stores/products';
	import { onMount } from 'svelte';
	import { persistentProductStore } from '$lib/stores/persistent-products';

	let { data } = $props<{ data: PageData }>();

	// Log the product data for debugging
	console.log('Product data:', data.product);
	console.log('Category:', data.product.category);
	console.log('Variants:', data.product.variants);
	console.log('Accessory Products:', data.accessoryProducts);
	console.log('Accessory Variants:', data.accessoryVariants);

	// Initialize the product store with the data
	onMount(() => {
		if (data.product.category.toUpperCase() === 'KEYBOARD') {
			persistentProductStore.loadKeyboardWithAccessories(
				data.product,
				data.product.variants,
				data.product.images,
				data.accessoryProducts,
				data.accessoryVariants,
				data.accessoryImages
			);
		} else {
			// For non-keyboard products, just load the main product
			productStore.setProducts([data.product]);
			productStore.setVariants(data.product.variants);
			productStore.setImages(data.product.images);
		}
	});

	// Determine which component to use based on the product category
	const productCategory = data.product.category.toUpperCase();

	// Ensure product data is properly typed
	const product = data.product as Product;
	const variants = data.product.variants as ProductVariant[];
	const images = data.product.images as ProductImage[];
</script>

{#if productCategory === 'KEYBOARD'}
	<ProductDetailKeyboard
		{product}
		{variants}
		{images}
		accessoryProducts={data.accessoryProducts}
		accessoryVariants={data.accessoryVariants}
		accessoryImages={data.accessoryImages}
	/>
{:else}
	<ProductDetailAccessory {product} {variants} {images} />
{/if}
