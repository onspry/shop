<script lang="ts">
	import type { PageData } from './$types';
	import ProductDetailKeyboard from '$lib/components/product-detail-keyboard.svelte';
	import ProductDetailAccessory from '$lib/components/product-detail-accessory.svelte';

	let { data } = $props<{ data: PageData }>();

	// Derive product category safely
	const productCategory = $derived(data?.product?.category?.toUpperCase() ?? '');

	// Handle variant selection
	function handleVariantSelect(event: CustomEvent<{ variantId: string }>) {
		// No need to update URL, just pass the event to the component
		console.log('Variant selected:', event.detail.variantId);
	}
</script>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-8">
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
