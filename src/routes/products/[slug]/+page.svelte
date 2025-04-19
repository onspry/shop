<script lang="ts">
	import type { PageData } from './$types';
	import ProductDetailKeyboard from '$lib/components/product-detail-keyboard.svelte';
	import ProductDetailAccessory from '$lib/components/product-detail-accessory.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	let { data } = $props<{ data: PageData }>();

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);

		return () => clearTimeout(timer);
	});

	// Derive product category safely
	const productCategory = $derived(data?.product?.category?.toUpperCase() ?? '');

	// Handle variant selection
	function handleVariantSelect(event: CustomEvent<{ variantId: string }>) {
		// No need to update URL, just pass the event to the component
		console.log('Variant selected:', event.detail.variantId);
	}

	// Generate structured data for the product
	const structuredData = $derived(() => {
		if (!data?.product) return null;

		const product = data.product;
		const variants = data.variants || [];
		const images = data.images || [];
		const basePrice = variants.length > 0
			? Math.min(...variants.map((v: any) => Number(v.price)))
			: 0;

		return {
			'@context': 'https://schema.org/',
			'@type': 'Product',
			name: product.name,
			description: product.description,
			image: images?.[0]?.url,
			offers: {
				'@type': 'AggregateOffer',
				priceCurrency: 'USD',
				lowPrice: basePrice,
				highPrice: Math.max(...variants.map((v: any) => Number(v.price))),
				availability: variants.some((v: any) => v.stockStatus === 'in_stock')
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock'
			}
		};
	});

	// Get the store name from the messages
	const storeName = m.shop_title();
</script>

<!-- Add SEO metadata to head -->
<svelte:head>
	{#if data?.product}
		<script type="application/ld+json">
			{JSON.stringify(structuredData)}
		</script>
		<title>{data.product.name} - {storeName}</title>
		<meta name="description" content={data.product.description} />
		<meta property="og:title" content={data.product.name} />
		<meta property="og:description" content={data.product.description} />
		{#if data.images?.[0]?.url}
			<meta property="og:image" content={data.images[0].url} />
		{/if}
		<link rel="canonical" href={`/products/${data.product.slug}`} />
	{/if}
</svelte:head>

<div class="min-h-screen bg-background">
	<div
		class="container mx-auto px-4 py-4 transition-opacity duration-500"
		class:opacity-0={!contentVisible}
		class:opacity-100={contentVisible}
	>
		{#if !data}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		{:else if productCategory === 'KEYBOARD'}
			<ProductDetailKeyboard
				product={data.product}
				variants={data.variants}
				images={data.images}
				switches={data.switches}
				keycaps={data.keycaps}
				searchParams={data.searchParams}
				onvariantselect={handleVariantSelect}
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
