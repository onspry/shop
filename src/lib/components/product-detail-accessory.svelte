<script lang="ts">
	import * as m from '$lib/paraglide/messages/en.js';
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/ui/variant-card.svelte';

	let {
		product = {} as Product,
		variants = [],
		images = []
	} = $props<{
		product?: Product;
		variants?: ProductVariant[];
		images?: ProductImage[];
	}>();

	// Derived data
	const basePrice = $derived(
		variants?.length > 0 ? Math.min(...variants.map((v: ProductVariant) => Number(v.price))) : 0
	);

	// State management for selected options
	let selectedVariantId = $state<string | null>(null);

	// Set default selected variant
	$effect(() => {
		if (variants?.length > 0 && !selectedVariantId) {
			selectedVariantId = variants[0].id;
		}
	});

	// Get the selected variant based on current selection
	const selectedVariant = $derived(
		variants?.find((v: ProductVariant) => v.id === selectedVariantId) || variants?.[0]
	);

	// Format price for display
	function formatPrice(price: number): string {
		return (price / 100).toFixed(2);
	}

	// Handle variant selection
	function selectVariant(variantId: string) {
		selectedVariantId = variantId;
	}

	// Add to cart function
	function addToCart() {
		if (!selectedVariant) return;
		// Implementation would depend on your cart store/system
		alert(`Added ${selectedVariant.name} to cart`);
	}

	// Add this function to handle image loading errors
	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		imgElement.src = `/placeholder-${product?.category?.toLowerCase() || 'default'}.jpg`;
	}

	// Helper function to get variant attribute
	function getVariantAttribute(variant: ProductVariant, key: string): string {
		try {
			const attributes = variant.attributes as Record<string, string>;
			return attributes[key] || '';
		} catch (e) {
			return '';
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	{#if !product?.id}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Product Images -->
			<div class="space-y-4">
				{#if images?.length > 0}
					<div class="aspect-square overflow-hidden rounded-lg bg-muted">
						<img
							src={images[0].url}
							alt={images[0].alt}
							class="h-full w-full object-cover object-center"
							onerror={handleImageError}
						/>
					</div>

					{#if images.length > 1}
						<div class="grid grid-cols-4 gap-2">
							{#each images as image, i}
								<div class="aspect-square overflow-hidden rounded-md bg-muted">
									<img
										src={image.url}
										alt={image.alt}
										class="h-full w-full object-cover object-center cursor-pointer hover:opacity-80 transition-opacity"
										onerror={handleImageError}
									/>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="aspect-square flex items-center justify-center rounded-lg bg-muted">
						<span class="text-muted-foreground">No image available</span>
					</div>
				{/if}
			</div>

			<!-- Product Details -->
			<div class="space-y-6">
				<div>
					<h1 class="text-3xl font-bold">{product.name}</h1>
					<p class="text-lg font-medium text-muted-foreground">
						${formatPrice(selectedVariant?.price || basePrice)}
					</p>
				</div>

				<Separator />

				<div class="space-y-2">
					<p class="text-muted-foreground">{product.description}</p>
				</div>

				<!-- Accessory Configuration Options -->
				<div class="space-y-6">
					<div class="space-y-4">
						<div>
							<Label for="variant-selection">{product.category} Options</Label>
							<div class="grid grid-cols-3 gap-3 mt-2" id="variant-selection">
								{#each variants || [] as variant}
									<VariantCard
										{variant}
										isSelected={selectedVariantId === variant.id}
										onClick={() => selectVariant(variant.id)}
									/>
								{/each}
							</div>
						</div>
					</div>

					{#if selectedVariant}
						<div class="bg-muted p-4 rounded-md">
							<h3 class="font-medium mb-2">Selected Option</h3>
							<div class="grid grid-cols-2 gap-2 text-sm">
								{#if product.category === 'SWITCHES'}
									<div>Type:</div>
									<div>{getVariantAttribute(selectedVariant, 'type') || 'N/A'}</div>

									<div>Actuation Force:</div>
									<div>{getVariantAttribute(selectedVariant, 'actuation_force') || 'N/A'}</div>

									<div>Feel:</div>
									<div>{getVariantAttribute(selectedVariant, 'feel') || 'N/A'}</div>
								{:else if product.category === 'KEYCAPS'}
									<div>Legend Type:</div>
									<div>{getVariantAttribute(selectedVariant, 'legend_type') || 'N/A'}</div>

									<div>Material:</div>
									<div>{getVariantAttribute(selectedVariant, 'material') || 'N/A'}</div>

									<div>Color:</div>
									<div>{getVariantAttribute(selectedVariant, 'color') || 'N/A'}</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="pt-4">
					<Button onclick={addToCart} class="w-full">
						{m.product_add_to_cart()}
					</Button>
				</div>

				{#if product.features?.length > 0}
					<div class="space-y-2">
						<h3 class="text-lg font-medium">{m.product_features()}</h3>
						<ul class="list-disc pl-5 space-y-1">
							{#each product.features as feature}
								<li>{feature}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if product.specifications && Object.keys(product.specifications).length > 0}
					<div class="space-y-2">
						<h3 class="text-lg font-medium">{m.product_specifications()}</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each Object.entries(product.specifications) as [key, value]}
								<div class="text-sm">{key}:</div>
								<div class="text-sm">{value}</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
