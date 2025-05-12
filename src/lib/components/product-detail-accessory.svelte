<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type {
		ProductViewModel,
		ProductVariantViewModel,
		ProductImageViewModel
	} from '$lib/models/product';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/variant-card.svelte';
	// AppImage is now used via ProductImageGallery
	import ProductImageGallery from '$lib/components/product-image-gallery.svelte';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingCart, Check, Minus, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { cart } from '$lib/stores/cart';
	import { preloadData } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { product, variants, images } = $props<{
		product: ProductViewModel;
		variants: ProductVariantViewModel[];
		images: ProductImageViewModel[];
	}>();

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

	// Add to cart state
	let isAddingToCart = $state(false);
	let addedToCart = $state(false);

	// Helper function to get specific variant attributes
	function getVariantAttribute(variant: ProductVariantViewModel, attribute: string): string {
		return (variant.attributes?.[attribute] as string) || '';
	}

	// Add to cart functionality
	function handleAddToCartResult(result: { type: string; status?: number; data?: any }) {
		if (result.type === 'success') {
			addedToCart = true;

			// Update the cart store with the returned data
			if (result.data?.cart) {
				console.log('Setting cart with data from product page:', result.data.cart);
				cart.set(result.data.cart);
			}

			// Show success toast with checkout and view cart actions
			toast.success(`${product.name} added to your cart!`, {
				action: {
					label: 'View Cart',
					onClick: () => goto(localizeHref('/cart'))
				},
				duration: 3000 // Shorter duration for success toast
			});
		} else {
			// Handle error cases
			const errorMessage = result.data?.message || 'Could not add item to cart. Please try again.';
			toast.error(errorMessage);
		}

		// Reset loading state
		isAddingToCart = false;
	}

	// Check if variant is available
	const isVariantAvailable = $derived(
		!!selectedVariant && selectedVariant.stockStatus !== 'out_of_stock'
	);

	// Image handling is now done by ProductImageGallery component
</script>

<div>
	{#if !product?.id}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
		</div>
	{:else}
		<div class="py-8">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-x-12 lg:gap-x-16 items-start">
				<!-- Product Images -->
				<div
					class="md:col-span-3 flex justify-center items-start md:sticky md:top-20 md:self-start"
				>
					<div class="w-full max-w-2xl rounded-2xl min-h-[400px] md:min-h-[500px]">
						<ProductImageGallery {images} />
					</div>
				</div>

				<!-- Product Details -->
				<div class="md:col-span-2 flex flex-col space-y-10 pt-8 md:pt-0">
					<div class="space-y-2">
						<h1 class="text-3xl lg:text-4xl font-bold">{product.name}</h1>
						<p class="text-xl lg:text-2xl font-medium text-muted-foreground">
							{formatPrice(selectedVariant?.price || basePrice)}
						</p>
						{#if product.description}
							<p class="text-base text-muted-foreground pt-2">{product.description}</p>
						{/if}
					</div>

					<Separator />

					<!-- Accessory Configuration Options -->
					<div class="space-y-4">
						<h2 class="text-xl font-semibold">{product.category} Options</h2>
						<div class="grid grid-cols-1 gap-3">
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

					{#if selectedVariant}
						<div class="bg-muted/50 p-4 rounded-md border">
							<h3 class="text-md font-semibold mb-3">Selected Option</h3>
							<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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

					<!-- Add to cart section -->
					<div class="space-y-6 pt-4 border-t">
						<!-- Quantity selector -->
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">{m.product_quantity()}</span>
							<div
								class="flex items-center space-x-1 bg-muted/30 dark:bg-muted/20 rounded-md p-1 border"
							>
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7"
									onclick={() => quantity > 1 && (quantity -= 1)}
									disabled={quantity <= 1 || isAddingToCart}
									aria-label="Decrease quantity"><Minus class="h-4 w-4" /></Button
								>
								<span class="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
								<Button
									variant="ghost"
									size="icon"
									class="h-7 w-7"
									onclick={() => (quantity += 1)}
									disabled={isAddingToCart}
									aria-label="Increase quantity"><Plus class="h-4 w-4" /></Button
								>
							</div>
						</div>

						<!-- Total price -->
						<div class="flex justify-between items-center">
							<span class="text-base font-medium">{m.product_total()}</span>
							<span class="text-2xl font-bold">
								{selectedVariant ? formatPrice(selectedVariant.price * quantity) : '--'}
							</span>
						</div>

						<!-- Add to cart form with server action -->
						<form
							method="POST"
							action="?/addToCart"
							class="space-y-4"
							use:enhance={() => {
								// Set loading state
								isAddingToCart = true;

								// Show loading toast
								const toastId = toast.loading(`Adding ${product.name} to cart...`, {
									duration: 30000
								});

								return async ({ result }) => {
									// Dismiss loading toast
									toast.dismiss(toastId);
									handleAddToCartResult(result);
								};
							}}
						>
							<input type="hidden" name="productVariantId" value={selectedVariant?.id || ''} />
							<input type="hidden" name="quantity" value={quantity} />

							<Button
								type="submit"
								size="lg"
								class="w-full"
								disabled={!isVariantAvailable || isAddingToCart}
							>
								{#if isAddingToCart}
									<span
										class="h-5 w-5 block animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"
									></span>
									<span>Adding...</span>
								{:else if addedToCart}
									<Check class="h-5 w-5 mr-2" />
									<span>Added to Cart</span>
								{:else if selectedVariant?.stockStatus === 'out_of_stock'}
									<span>{m.product_out_of_stock()}</span>
								{:else}
									<ShoppingCart class="h-5 w-5 mr-2" />
									<span>{m.addToCart()}</span>
								{/if}
							</Button>
						</form>

						{#if addedToCart}
							<div class="flex justify-between gap-3 mt-3">
								<a href={localizeHref('/cart')} class="flex-1" data-sveltekit-preload-data="hover">
									<Button variant="outline" class="w-full">{m.view_cart()}</Button>
								</a>
								<a
									href={localizeHref('/checkout')}
									class="flex-1"
									data-sveltekit-preload-data="hover"
								>
									<Button variant="outline" class="w-full">{m.checkout()}</Button>
								</a>
							</div>
						{/if}
					</div>

					<!-- Features and Specifications -->
					{#if product.features?.length > 0 || (product.specifications && Object.keys(product.specifications).length > 0)}
						<div class="pt-6 border-t space-y-6">
							{#if product.features?.length > 0}
								<div class="space-y-2">
									<h3 class="text-md font-semibold">{m.product_features()}</h3>
									<ul class="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
										{#each product.features as feature}
											<li>{feature}</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if product.specifications && Object.keys(product.specifications).length > 0}
								<div class="space-y-2">
									<h3 class="text-md font-semibold">{m.product_specifications()}</h3>
									<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
										{#each Object.entries(product.specifications) as [key, value]}
											<div class="capitalize">{key.replace(/_/g, ' ')}:</div>
											<div>{String(value)}</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
