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
import { AppImage } from '$lib/components/ui/app-image';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingCart, Check, Minus, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { cart } from '$lib/stores/cart';

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
					onClick: () => goto('/cart')
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

	// Track valid images
	let validImages = $state<string[]>([]);

	// Initialize valid images
	$effect(() => {
		if (images) {
			validImages = images.map((img: { url: string; }) => img.url);
		}
	});

	// Calculate number of valid images
	const validImageCount = $derived(validImages.length);
</script>

<div>
	{#if !product?.id}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Product Images -->
			<div class="relative">
				{#if images?.length > 0}
					{#if validImageCount > 1}
						<!-- Multiple images: show thumbnails on the left -->
						<div class="flex gap-4">
							<div class="flex flex-col gap-2 w-20">
								{#each images as image, index (image.url)}
									<Button
										variant="ghost"
										size="icon"
										onclick={() => {
											// Move this image to first position in display
											const temp = [...images];
											const selectedImg = temp.splice(index, 1)[0];
											temp.unshift(selectedImg);
											images = temp;
										}}
										aria-label="View {image.alt}"
										class="p-0 h-auto w-auto hover:bg-transparent"
									>
										<AppImage
											src={image.url}
											alt={image.alt}
											width={80}
											height={80}
											thumbnailMode={true}
											isSelected={index === 0}
										/>
									</Button>
								{/each}
							</div>

							<!-- Main image (with thumbnails) -->
							<div class="flex-1">
								<div class="aspect-square max-w-lg mx-auto overflow-hidden rounded-lg">
									<AppImage
										src={images[0].url}
										alt={images[0].alt}
										width={550}
										height={550}
										className="w-full h-full"
										objectFit="contain"
									/>
								</div>
							</div>
						</div>
					{:else}
						<!-- Single image: centered with no thumbnails -->
						<div class="w-full">
							<div class="aspect-square max-w-lg mx-auto overflow-hidden rounded-lg">
								<AppImage
									src={images[0].url}
									alt={images[0].alt}
									width={550}
									height={550}
									className="w-full h-full"
									objectFit="contain"
								/>
							</div>
						</div>
					{/if}
				{:else}
					<div class="aspect-square w-full max-w-lg mx-auto flex items-center justify-center rounded-lg bg-muted">
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
						<div class="flex items-center space-x-2 bg-muted/10 dark:bg-muted/5 rounded-md p-1.5 border border-border/50 dark:border-border">
							<Button
								class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
								variant="ghost"
								type="button"
								onclick={() => quantity > 1 && (quantity -= 1)}
								disabled={quantity <= 1 || isAddingToCart}
								aria-label="Decrease quantity"
							>
								<Minus class="h-4 w-4" />
							</Button>
							<span class="w-8 text-center text-sm font-medium">{quantity}</span>
							<Button
								class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
								variant="ghost"
								type="button"
								onclick={() => (quantity += 1)}
								disabled={isAddingToCart}
								aria-label="Increase quantity"
							>
								<Plus class="h-4 w-4" />
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

					<!-- Add to cart form with server action -->
					<form
						method="POST"
						action="?/addToCart"
						use:enhance={() => {
							// Set loading state
							isAddingToCart = true;

							// Show loading toast
							const toastId = toast.loading(`Adding ${product.name} to cart...`, { duration: 30000 });

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
							disabled={!isVariantAvailable || isAddingToCart}
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
					</form>

					{#if addedToCart}
						<div class="flex justify-between gap-2 mt-2">
							<Button variant="outline" class="flex-1" href="/cart">{m.view_cart()}</Button>
							<Button variant="outline" class="flex-1" href="/checkout">{m.checkout()}</Button>
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
