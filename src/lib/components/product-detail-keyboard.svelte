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
	import { ProductCompatibilityService } from '$lib/utils/product-compatibility';
	import { browser } from '$app/environment';
	import { goto, pushState } from '$app/navigation';
	import { ShoppingCart, Check, Minus, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { cart } from '$lib/stores/cart';

	// Props
	let {
		product,
		variants,
		images,
		switches = [],
		keycaps = [],
		onvariantselect = () => {},
		onSwitchSelect = () => {},
		onKeycapSelect = () => {},
		searchParams
	} = $props<{
		product: ProductViewModel;
		variants: ProductVariantViewModel[];
		images: ProductImageViewModel[];
		switches?: ProductViewModel[];
		keycaps?: ProductViewModel[];
		onvariantselect?: (e: CustomEvent<{ variantId: string }>) => void;
		onSwitchSelect?: (switchId: string | null) => void;
		onKeycapSelect?: (keycapId: string | null) => void;
		searchParams: { variant: string | null; switch: string | null; keycap: string | null };
	}>();

	// Core state variables
	let currentVariantId = $state<string | null>(null);
	let currentSwitchId = $state<string | null>(null);
	let currentKeycapId = $state<string | null>(null);
	let isLoading = $state(false);

	// Selection state is tracked through the individual variables above

	// Derived states for selections and compatibility
	let selectedVariant = $state<ProductVariantViewModel | null>(null);
	let compatibleSwitches = $state<ProductVariantViewModel[]>([]);
	let selectedSwitch = $state<ProductVariantViewModel | null>(null);
	let compatibleKeycaps = $state<ProductVariantViewModel[]>([]);
	let selectedKeycap = $state<ProductVariantViewModel | null>(null);
	// Selection state is tracked through the individual variables above

	// Get initial selections from URL parameters
	const urlVariantId = searchParams.variant;
	const urlSwitchId = searchParams.switch;
	const urlKeycapId = searchParams.keycap;

	// Initialize state with URL values if they exist
	currentVariantId = urlVariantId || null;
	currentSwitchId = urlSwitchId || null;
	currentKeycapId = urlKeycapId || null;

	// Update derived values
	$effect(() => {
		selectedVariant = !currentVariantId
			? null
			: (variants.find((v: ProductVariantViewModel) => v.id === currentVariantId) ?? null);
	});

	$effect(() => {
		if (!selectedVariant) {
			compatibleSwitches = [];
			return;
		}
		compatibleSwitches = ProductCompatibilityService.filterCompatibleProducts(
			product,
			selectedVariant,
			switches
		).flatMap((s) => s.variants);
	});

	$effect(() => {
		selectedSwitch = !currentSwitchId
			? null
			: (compatibleSwitches.find((v: ProductVariantViewModel) => v.id === currentSwitchId) ?? null);
	});

	$effect(() => {
		if (!selectedSwitch) {
			compatibleKeycaps = [];
			return;
		}
		compatibleKeycaps = ProductCompatibilityService.filterCompatibleProducts(
			product,
			selectedSwitch,
			keycaps
		).flatMap((k) => k.variants);
	});

	$effect(() => {
		selectedKeycap = !currentKeycapId
			? null
			: (compatibleKeycaps.find((v: ProductVariantViewModel) => v.id === currentKeycapId) ?? null);
	});

	// Selection state is tracked through the individual variables above

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

	// Derived data
	const basePrice = $derived(
		variants?.length > 0
			? Math.min(...variants.map((v: ProductVariantViewModel) => Number(v.price)))
			: 0
	);

	// Add browser state management using SvelteKit's pushState
	function updateBrowserState(
		variantId: string | null,
		switchId: string | null,
		keycapId: string | null
	) {
		if (!browser) return;

		// Create a query string from the state
		const params = new URLSearchParams();
		if (variantId) params.set('variant', variantId);
		if (switchId) params.set('switch', switchId);
		if (keycapId) params.set('keycap', keycapId);

		const url = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
		pushState(url, { state: { variantId, switchId, keycapId } });
	}

	// Selection handlers
	async function selectVariant(variantId: string) {
		isLoading = true;
		try {
			currentVariantId = variantId;
			currentSwitchId = null;
			currentKeycapId = null;
			updateBrowserState(variantId, null, null);
			onvariantselect(new CustomEvent('variantselect', { detail: { variantId } }));
		} finally {
			isLoading = false;
		}
	}

	async function selectSwitch(switchId: string) {
		if (!selectedVariant) return;
		isLoading = true;
		try {
			currentSwitchId = switchId;
			currentKeycapId = null;
			updateBrowserState(currentVariantId!, switchId, null);
			onSwitchSelect(switchId);
		} finally {
			isLoading = false;
		}
	}

	async function selectKeycap(keycapId: string) {
		if (!selectedSwitch) return;
		isLoading = true;
		try {
			currentKeycapId = keycapId;
			updateBrowserState(currentVariantId!, currentSwitchId!, keycapId);
			onKeycapSelect(keycapId);
		} finally {
			isLoading = false;
		}
	}

	// Handle browser back/forward
	if (browser) {
		window.onpopstate = (event) => {
			if (event.state) {
				currentVariantId = event.state.variantId;
				currentSwitchId = event.state.switchId;
				currentKeycapId = event.state.keycapId;
			}
		};
	}

	// Add new state for cart operations
	let quantity = $state(1);
	let isAddingToCart = $state(false);
	let addedToCart = $state(false);

	// Cart store is imported at the top of the file

	// Function to handle the result of adding to cart
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

			// Reset the success message after 3 seconds, but keep the selection
			setTimeout(() => {
				addedToCart = false;
			}, 3000);
		} else {
			// Handle error cases
			const errorMessage = result.data?.message || 'Could not add item to cart. Please try again.';
			toast.error(errorMessage);
		}

		// Reset loading state
		isAddingToCart = false;
	}

	// Image loading state is tracked but not actively used

	// Helper function to get variant attribute with type safety
	function getVariantAttribute<T>(
		variant: ProductVariantViewModel | null,
		key: string,
		defaultValue: T
	): T {
		if (!variant) return defaultValue;
		try {
			const value = variant.attributes[key];
			return (value as T) ?? defaultValue;
		} catch (e) {
			return defaultValue;
		}
	}

	// Helper functions for compatibility are handled by the ProductCompatibilityService

	// Helper function to get button text based on selection state
	function getButtonText(): string {
		if (!selectedVariant) {
			return m.product_select_keyboard();
		}
		if (selectedVariant.stockStatus === 'out_of_stock') {
			return m.product_out_of_stock();
		}
		if (!selectedSwitch) {
			return m.product_select_switch();
		}
		if (!selectedKeycap) {
			return m.product_select_keycap();
		}
		return m.product_add_to_cart();
	}

	// Derived state for cart button
	let canAddToCart = $derived(
		!!selectedVariant &&
			selectedVariant.stockStatus === 'in_stock' &&
			!!selectedSwitch &&
			!!selectedKeycap
	);

	// Add state for current main image
	let currentImageIndex = $state(0);

	// Function to switch main image
	function switchMainImage(index: number) {
		currentImageIndex = index;
	}
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
								{#each images as image, index}
									<Button
										variant="ghost"
										size="icon"
										onclick={() => switchMainImage(index)}
										aria-label="View {image.alt}"
										class="p-0 h-auto w-auto hover:bg-transparent"
									>
										<AppImage
											src={image.url}
											alt={image.alt}
											width={80}
											height={80}
											thumbnailMode={true}
											isSelected={currentImageIndex === index}
										/>
									</Button>
								{/each}
							</div>

							<!-- Main image (with thumbnails) -->
							<div class="flex-1">
								<div class="aspect-square max-w-lg mx-auto overflow-hidden rounded-lg">
									<AppImage
										src={images[currentImageIndex].url}
										alt={images[currentImageIndex].alt}
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
									src={images[currentImageIndex].url}
									alt={images[currentImageIndex].alt}
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

				<!-- Configuration Options -->
				<div class="space-y-8">
					<!-- Keyboard Variants -->
					<div class="space-y-4">
						<div>
							<Label for="variant-selection">Keyboard Options</Label>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" id="variant-selection">
								{#each variants || [] as variant}
									<VariantCard
										{variant}
										isSelected={currentVariantId === variant.id}
										onClick={() => selectVariant(variant.id)}
										showPrice={true}
										disabled={isLoading || isAddingToCart}
									/>
								{/each}
							</div>
						</div>
					</div>

					<!-- Switch Options -->
					{#if compatibleSwitches.length > 0}
						<div class="space-y-4">
							<div>
								<Label for="switch-selection">Compatible Switches</Label>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" id="switch-selection">
									{#each compatibleSwitches as switchVariant}
										<VariantCard
											variant={switchVariant}
											isSelected={currentSwitchId === switchVariant.id}
											onClick={() => selectSwitch(switchVariant.id)}
											showPrice={false}
											disabled={isLoading || isAddingToCart}
										/>
									{/each}
								</div>
							</div>
						</div>
					{:else if selectedVariant}
						<div class="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
							<div class="text-muted-foreground text-center">
								No compatible switches found for this keyboard variant.
							</div>
						</div>
					{/if}

					<!-- Keycap Options -->
					{#if compatibleKeycaps.length > 0}
						<div class="space-y-4">
							<div>
								<Label for="keycap-selection">Compatible Keycaps</Label>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" id="keycap-selection">
									{#each compatibleKeycaps as keycapVariant}
										<VariantCard
											variant={keycapVariant}
											isSelected={currentKeycapId === keycapVariant.id}
											onClick={() => selectKeycap(keycapVariant.id)}
											showPrice={false}
											disabled={isLoading || isAddingToCart}
										/>
									{/each}
								</div>
							</div>
						</div>
					{:else if selectedSwitch}
						<div class="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
							<div class="text-muted-foreground text-center">
								No compatible keycaps found for this switch type.
							</div>
						</div>
					{/if}

					<!-- Selected Options Summary -->
					{#if selectedVariant}
						<div class="bg-muted p-4 rounded-md">
							<h3 class="font-medium mb-2">Selected Options</h3>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<div>Layout:</div>
								<div>{getVariantAttribute(selectedVariant, 'layout', 'N/A')}</div>

								<div>Keyboard Variant:</div>
								<div>{getVariantAttribute(selectedVariant, 'keyboard_variant', 'N/A')}</div>

								{#if selectedSwitch}
									<div>Switch Type:</div>
									<div>{getVariantAttribute(selectedSwitch, 'type', 'N/A')}</div>

									<div>Actuation Force:</div>
									<div>{getVariantAttribute(selectedSwitch, 'actuation_force', 'N/A')}</div>

									<div>Feel:</div>
									<div>{getVariantAttribute(selectedSwitch, 'feel', 'N/A')}</div>
								{/if}

								{#if selectedKeycap}
									<div>Legend Type:</div>
									<div>{getVariantAttribute(selectedKeycap, 'legend_type', 'N/A')}</div>

									<div>Material:</div>
									<div>{getVariantAttribute(selectedKeycap, 'material', 'N/A')}</div>

									<div>Color:</div>
									<div>{getVariantAttribute(selectedKeycap, 'color', 'N/A')}</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="space-y-4">
					<!-- Add to cart section -->
					<div class="space-y-4 mt-6">
						<!-- Quantity selector -->
						<div class="flex items-center gap-3">
							<span class="text-sm font-medium">{m.product_quantity()}</span>
							<div class="flex items-center space-x-2 bg-muted/10 dark:bg-muted/5 rounded-md p-1.5 border border-border/50 dark:border-border">
								<Button
									class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
									variant="ghost"
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

							<!-- Add composites for switches and keycaps if selected -->
							{#if selectedSwitch}
								<input type="hidden" name="composites[0][variantId]" value={selectedSwitch.id} />
								<input type="hidden" name="composites[0][name]" value={selectedSwitch.name} />
								<input type="hidden" name="composites[0][quantity]" value={quantity} />
							{/if}

							{#if selectedKeycap}
								<input type="hidden" name="composites[1][variantId]" value={selectedKeycap.id} />
								<input type="hidden" name="composites[1][name]" value={selectedKeycap.name} />
								<input type="hidden" name="composites[1][quantity]" value={quantity} />
							{/if}

							<Button
								variant="default"
								size="lg"
								type="submit"
								disabled={!canAddToCart || isAddingToCart}
								class="w-full"
							>
								{#if isAddingToCart}
									<span
										class="h-5 w-5 block animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
									></span>
									<span>Adding...</span>
								{:else if addedToCart}
									<Check class="h-5 w-5" />
									<span>Added to Cart</span>
								{:else}
									<ShoppingCart class="h-5 w-5" />
									<span>{getButtonText()}</span>
								{/if}
							</Button>
						</form>

						{#if addedToCart}
							<div class="flex justify-between gap-2 mt-2">
								<Button variant="outline" class="flex-1" href="/cart">
									<span>{m.view_cart()}</span>
								</Button>
								<Button variant="outline" class="flex-1" href="/checkout">
									<span>{m.checkout()}</span>
								</Button>
							</div>
						{/if}
					</div>
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
