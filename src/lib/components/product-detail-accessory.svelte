<script lang="ts">
	import * as m from '$lib/paraglide/messages/en.js';
	import type {
		ProductViewModel,
		ProductVariantViewModel,
		ProductImageViewModel
	} from '$lib/models/product';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/variant-card.svelte';
	import { formatPrice } from '$lib/utils/price';
	import { cartActions } from '$lib/stores/cart';
	import { ShoppingCart, Check } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { product, variants, images } = $props<{
		product: ProductViewModel;
		variants: ProductVariantViewModel[];
		images: ProductImageViewModel[];
	}>();

	// Image loading state
	let loadedImages = $state(new Set<string>());

	// Derived data
	const basePrice = $derived(
		variants?.length > 0
			? Math.min(...variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
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
		variants?.find((v: ProductVariantViewModel) => v.id === selectedVariantId) || variants?.[0]
	);

	// Handle variant selection
	function selectVariant(variantId: string) {
		selectedVariantId = variantId;
	}

	// Quantity counter
	let quantity = $state(1);
	const incrementQuantity = () => quantity++;
	const decrementQuantity = () => (quantity = Math.max(1, quantity - 1));

	// Add to cart state
	let isAddingToCart = $state(false);
	let addedToCart = $state(false);

	// Helper function to get specific variant attributes
	function getVariantAttribute(variant: ProductVariantViewModel, attribute: string): string {
		return (variant.attributes?.[attribute] as string) || '';
	}

	// Image utility functions
	function getOptimizedImageUrl(url: string, width: number, height: number): string {
		if (!url) return '';
		// Ensure URL starts with a forward slash if it's a relative path
		if (!url.startsWith('/') && !url.startsWith('http')) {
			url = '/' + url;
		}
		return `${url}?w=${width}&h=${height}&q=80&format=webp`;
	}

	function handleImageLoad(event: Event) {
		const img = event.target as HTMLImageElement;
		if (img.src) {
			loadedImages.add(img.src);
		}
	}

	function handleImageError() {
		// Image error handling logic here
	}

	// Add to cart functionality
	async function addToCart() {
		if (!selectedVariant || isAddingToCart) return;

		isAddingToCart = true;
		try {
			const success = await cartActions.addToCart({
				productVariantId: selectedVariant.id,
				quantity
			});

			if (success) {
				addedToCart = true;

				// Show success toast with checkout and view cart actions
				toast.success(`${product.name} added to your cart!`, {
					action: {
						label: 'View Cart',
						onClick: () => goto('/cart')
					},
					duration: 5000
				});
			} else {
				toast.error('Could not add item to cart. Please try again.');
			}
		} catch (error) {
			console.error('Error adding to cart:', error);
			toast.error('An error occurred while adding to cart');
		} finally {
			isAddingToCart = false;
		}
	}

	// Check if configuration is complete
	const canAddToCart = $derived(
		!!selectedVariant && selectedVariant.stockStatus !== 'out_of_stock'
	);
</script>

<div class="container mx-auto px-4 py-8">
	{#if !product?.id}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Product Images -->
			<div class="relative">
				{#if images?.length > 0}
					<div class="flex gap-4">
						<!-- Thumbnails on the left -->
						{#if images.length > 1}
							<div class="flex flex-col gap-2 w-20">
								{#each images as image, index (image.url)}
									<Button
										type="button"
										class={`aspect-square overflow-hidden rounded-md bg-muted relative cursor-pointer hover:opacity-80 transition-opacity border-0 p-0 w-full ${
											loadedImages.has(image.url) && index === 0 ? 'ring-2 ring-primary' : ''
										}`}
										onclick={() => {
											// Move this image to first position in display
											const temp = [...images];
											const selectedImg = temp.splice(index, 1)[0];
											temp.unshift(selectedImg);
											images = temp;
										}}
										aria-label={`View ${image.alt || 'product image'}`}
									>
										{#if !loadedImages.has(image.url)}
											<div class="absolute inset-0 flex items-center justify-center">
												<div class="animate-pulse bg-muted-foreground/20 w-full h-full"></div>
											</div>
										{/if}
										<img
											src={getOptimizedImageUrl(image.url, 80, 80)}
											alt={image.alt}
											width={80}
											height={80}
											loading="lazy"
											class="h-full w-full object-contain object-center transition-opacity duration-300"
											class:opacity-0={!loadedImages.has(image.url)}
											class:opacity-100={loadedImages.has(image.url)}
											onload={handleImageLoad}
											onerror={handleImageError}
										/>
									</Button>
								{/each}
							</div>
						{/if}

						<!-- Main image on the right -->
						<div class="flex-1">
							<div class="aspect-square max-w-lg mx-auto rounded-lg bg-muted relative">
								{#if !loadedImages.has(images[0].url)}
									<div class="absolute inset-0 flex items-center justify-center">
										<div class="animate-pulse bg-muted-foreground/20 w-full h-full"></div>
									</div>
								{/if}
								<img
									src={getOptimizedImageUrl(images[0].url, 550, 550)}
									alt={images[0].alt}
									width={550}
									height={550}
									loading="lazy"
									class="h-full w-full object-contain object-center transition-opacity duration-300"
									class:opacity-0={!loadedImages.has(images[0].url)}
									class:opacity-100={loadedImages.has(images[0].url)}
									onload={handleImageLoad}
									onerror={handleImageError}
								/>
							</div>
						</div>
					</div>
				{:else}
					<div class="aspect-square flex items-center justify-center rounded-lg bg-muted">
						<span class="text-muted-foreground">No image available</span>
					</div>
				{/if}
			</div>

			<!-- Product Details -->
			<div class="space-y-8">
				<div>
					<h1 class="text-3xl font-bold">{product.name}</h1>
					<p class="text-lg font-medium text-muted-foreground">
						{formatPrice(selectedVariant?.price || basePrice)}
					</p>
				</div>

				<Separator />

				<div class="space-y-2">
					<p class="text-muted-foreground">{product.description}</p>
				</div>

				<!-- Accessory Configuration Options -->
				<div class="space-y-8">
					<div class="space-y-4">
						<div>
							<Label for="variant-selection">{product.category} Options</Label>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" id="variant-selection">
								{#each variants || [] as variant}
									<VariantCard
										{variant}
										isSelected={selectedVariantId === variant.id}
										onClick={() => selectVariant(variant.id)}
										showPrice={true}
										disabled={isAddingToCart}
									/>
								{/each}
							</div>
						</div>
					</div>

					{#if selectedVariant}
						<div class="bg-muted p-4 rounded-md">
							<h3 class="font-medium mb-2">Selected Option</h3>
							<div class="grid grid-cols-2 gap-2 text-sm">
								{#if product.category === 'SWITCH'}
									<div>Type:</div>
									<div>{getVariantAttribute(selectedVariant, 'type') || 'N/A'}</div>

									<div>Actuation Force:</div>
									<div>{getVariantAttribute(selectedVariant, 'actuation_force') || 'N/A'}</div>

									<div>Feel:</div>
									<div>{getVariantAttribute(selectedVariant, 'feel') || 'N/A'}</div>
								{:else if product.category === 'KEYCAP'}
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

				<!-- Add to cart section -->
				<div class="space-y-4 mt-6">
					<!-- Quantity selector -->
					<div class="flex items-center gap-3">
						<span class="text-sm font-medium">{m.product_quantity()}</span>
						<div class="flex items-center">
							<Button
								type="button"
								onclick={() => quantity > 1 && (quantity -= 1)}
								class="px-2 py-1 border border-border rounded-l-md bg-card hover:bg-muted transition-colors"
								disabled={quantity <= 1 || isAddingToCart}
								aria-label="Decrease quantity"
							>
								-
							</Button>
							<span class="px-4 py-1 border-y border-border bg-background text-center w-12">
								{quantity}
							</span>
							<Button
								type="button"
								onclick={() => (quantity += 1)}
								class="px-2 py-1 border border-border rounded-r-md bg-card hover:bg-muted transition-colors"
								disabled={isAddingToCart}
								aria-label="Increase quantity"
							>
								+
							</Button>
						</div>
					</div>

					<!-- Total price -->
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium">{m.product_total()}</span>
						<span class="text-xl font-bold">
							{selectedVariant ? formatPrice(selectedVariant.price * quantity) : '--'}
						</span>
					</div>

					<!-- Add to cart button -->
					<Button
						type="button"
						onclick={addToCart}
						disabled={!selectedVariant ||
							isAddingToCart ||
							selectedVariant.stockStatus === 'out_of_stock'}
						class="w-full mt-6 py-3 px-6 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isAddingToCart}
							<span
								class="h-5 w-5 block animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
							></span>
							<span>Adding...</span>
						{:else if addedToCart}
							<Check class="h-5 w-5" />
							<span>Added to Cart</span>
						{:else if selectedVariant?.stockStatus === 'out_of_stock'}
							<span>{m.product_out_of_stock()}</span>
						{:else}
							<ShoppingCart class="h-5 w-5" />
							<span>{m.addToCart()}</span>
						{/if}
					</Button>

					{#if addedToCart}
						<div class="flex justify-between gap-2 mt-2">
							<Button variant="outline" class="flex-1" href="/cart">View Cart</Button>
							<Button variant="outline" class="flex-1" href="/checkout">Checkout</Button>
						</div>
					{/if}
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
