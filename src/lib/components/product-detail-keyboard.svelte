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
	import ImagePreview from '$lib/components/ui/image-preview.svelte';
	import { formatPrice } from '$lib/utils/price';
	import { ProductCompatibilityService } from '$lib/utils/product-compatibility';
	import { browser } from '$app/environment';
	import { goto, pushState } from '$app/navigation';
	import { cartActions } from '$lib/stores/cart';
	import { ShoppingCart, Check, ImageOff } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

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

	type SelectionStateType =
		| { state: 'initial' }
		| { state: 'variantSelected'; variantId: string }
		| { state: 'switchSelected'; variantId: string; switchId: string }
		| { state: 'complete'; variantId: string; switchId: string; keycapId: string };

	// Derived states for selections and compatibility
	let selectedVariant = $state<ProductVariantViewModel | null>(null);
	let compatibleSwitches = $state<ProductVariantViewModel[]>([]);
	let selectedSwitch = $state<ProductVariantViewModel | null>(null);
	let compatibleKeycaps = $state<ProductVariantViewModel[]>([]);
	let selectedKeycap = $state<ProductVariantViewModel | null>(null);
	let selectionState = $state<SelectionStateType>({ state: 'initial' });

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

	$effect(() => {
		const variant = selectedVariant;
		const variantId = currentVariantId;
		const switchId = currentSwitchId;
		const keycapId = currentKeycapId;

		if (!variant || !variantId) {
			selectionState = { state: 'initial' };
			return;
		}
		if (!selectedSwitch || !switchId) {
			selectionState = { state: 'variantSelected', variantId };
			return;
		}
		if (!selectedKeycap || !keycapId) {
			selectionState = {
				state: 'switchSelected',
				variantId,
				switchId
			};
			return;
		}
		selectionState = {
			state: 'complete',
			variantId,
			switchId,
			keycapId
		};
	});

	// Image loading state
	let loadedImages = $state(new Set<string>());

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

	// Add a new function to handle adding to cart
	async function addToCart() {
		if (!currentVariantId || isAddingToCart) return;

		isAddingToCart = true;

		try {
			const success = await cartActions.addToCart({
				productVariantId: currentVariantId,
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

				// Reset the success message after 3 seconds, but keep the selection
				setTimeout(() => {
					addedToCart = false;
				}, 3000);
			} else {
				toast.error('Could not add item to cart. Please try again.');
			}
		} catch (error) {
			toast.error('An error occurred while adding to cart');
			console.error('Error adding to cart:', error);
		} finally {
			isAddingToCart = false;
		}
	}

	// Image handling functions
	function handleImageLoad(event: Event) {
		const img = event.target as HTMLImageElement;
		loadedImages.add(img.src);
	}

	let imageErrors = $state(new Set<string>());

	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		const originalUrl = img.src.split('?')[0]; // Get the base URL without query params
		imageErrors.add(originalUrl);
	}

	function getOptimizedImageUrl(url: string, width: number, height: number): string {
		if (!url) return '';
		// Ensure URL starts with a forward slash if it's a relative path
		if (!url.startsWith('/') && !url.startsWith('http')) {
			url = '/' + url;
		}
		return `${url}?w=${width}&h=${height}&q=80&format=webp`;
	}

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

	// Helper function to get required accessories
	function getRequiredAccessories(variant: ProductVariantViewModel): string[] {
		return getVariantAttribute(variant, 'requiredAccessories', []);
	}

	// Helper function to get compatible products
	function getCompatibleProducts(
		variant: ProductVariantViewModel
	): Record<string, Record<string, string>> {
		return getVariantAttribute(variant, 'compatibleWith', {});
	}

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

	// Generate structured data for the product
	const structuredData = $derived(() => ({
		'@context': 'https://schema.org/',
		'@type': 'Product',
		name: product.name,
		description: product.description,
		image: images?.[0]?.url,
		offers: {
			'@type': 'AggregateOffer',
			priceCurrency: 'USD',
			lowPrice: basePrice,
			highPrice: Math.max(...variants.map((v: { price: any }) => Number(v.price))),
			availability:
				selectedVariant?.stockStatus === 'in_stock'
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock'
		}
	}));

	// Add state for current main image
	let currentImageIndex = $state(0);

	// Function to switch main image
	function switchMainImage(index: number) {
		currentImageIndex = index;
	}
</script>

<!-- Add structured data to head -->
<svelte:head>
	<script type="application/ld+json">
		{JSON.stringify(structuredData)}
	</script>
	<title>{product.name} - Your Store Name</title>
	<meta name="description" content={product.description} />
	<meta property="og:title" content={product.name} />
	<meta property="og:description" content={product.description} />
	{#if images?.[0]?.url}
		<meta property="og:image" content={images[0].url} />
	{/if}
	<link rel="canonical" href={`https://yourstore.com/products/${product.slug}`} />
</svelte:head>

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
					<div class="rounded-lg">
						<ImagePreview
							src={images[currentImageIndex].url}
							alt={images[currentImageIndex].alt}
							width={800}
							height={800}
							className="rounded-lg"
						/>
					</div>

					{#if images.length > 1}
						<div class="grid grid-cols-4 gap-2">
							{#each images as image, index}
								<Button
									variant="ghost"
									size="icon"
									onclick={() => switchMainImage(index)}
									aria-label="View {image.alt}"
									class="p-0 h-auto w-auto hover:bg-transparent aspect-square"
								>
									<ImagePreview
										src={image.url}
										alt={image.alt}
										width={400}
										height={400}
										className="transition-opacity duration-200 {currentImageIndex === index
											? 'opacity-100'
											: 'opacity-50'}"
									/>
								</Button>
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
										disabled={isLoading}
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
											showPrice={true}
											disabled={isLoading}
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
											showPrice={true}
											disabled={isLoading}
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
							<div class="flex items-center">
								<Button
									variant="ghost"
									onclick={() => quantity > 1 && (quantity -= 1)}
									disabled={quantity <= 1}
									aria-label="Decrease quantity"
									class="rounded-r-none"
								>
									-
								</Button>
								<span class="w-8 text-center text-sm">{quantity}</span>
								<Button
									variant="ghost"
									onclick={() => (quantity += 1)}
									aria-label="Increase quantity"
									class="rounded-l-none"
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
							variant="default"
							size="lg"
							onclick={addToCart}
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

						{#if addedToCart}
							<div class="flex justify-between gap-2 mt-2">
								<Button variant="outline" class="flex-1" href="/cart">
									<span>View Cart</span>
								</Button>
								<Button variant="outline" class="flex-1" href="/checkout">
									<span>Checkout</span>
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
