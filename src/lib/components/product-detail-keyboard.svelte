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
	import { ProductCompatibilityService } from '$lib/utils/product-compatibility';
	import { browser } from '$app/environment';
	import { goto, pushState, preloadData } from '$app/navigation';
	import { ShoppingCart, Check, Minus, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { cart } from '$lib/stores/cart';
	import { localizeHref, getLocale } from '$lib/paraglide/runtime';

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

		// First try standard compatibility filtering through the service
		let filteredKeycaps = ProductCompatibilityService.filterCompatibleProducts(
			product,
			selectedSwitch,
			keycaps
		).flatMap((k) => k.variants);

		// If we have no results, and we have keycaps available, check the stemType attribute directly
		// This is a fallback for multilingual content that might not be properly structured
		if (filteredKeycaps.length === 0 && keycaps.length > 0) {
			const switchStemType = getVariantAttribute(selectedSwitch, 'stemType', '');
			if (switchStemType) {
				// Get all keycap variants that support this stem type
				filteredKeycaps = keycaps
					.flatMap((k: ProductViewModel) => k.variants)
					.filter((keycapVariant: ProductVariantViewModel) => {
						const keycapStemTypes = getVariantAttribute<string | string[]>(
							keycapVariant,
							'stemType',
							[]
						);
						if (Array.isArray(keycapStemTypes)) {
							return keycapStemTypes.includes(switchStemType);
						}
						return keycapStemTypes === switchStemType;
					});
			}
		}

		compatibleKeycaps = filteredKeycaps;
	});

	$effect(() => {
		selectedKeycap = !currentKeycapId
			? null
			: (compatibleKeycaps.find((v: ProductVariantViewModel) => v.id === currentKeycapId) ?? null);
	});

	// Selection state is tracked through the individual variables above

	// Track valid images - now handled by ProductImageGallery
	// let validImages = $state<string[]>([]);

	// Initialize valid images
	// $effect(() => {
	// 	if (images) {
	// 		validImages = images.map((img: { url: string; }) => img.url);
	// 	}
	// });

	// Calculate number of valid images - used by ProductImageGallery
	// const validImageCount = $derived(validImages.length);

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
					onClick: () => goto(localizeHref('/cart'))
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

	// Image handling is now done by ProductImageGallery component

	// Add current locale derivation
	const currentLocale = $derived(getLocale());
</script>

{#if !product?.id}
	<div class="flex h-64 items-center justify-center">
		<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
	</div>
{:else}
	<div class="w-full py-8">
		<div class="flex w-full flex-col gap-8 lg:flex-row lg:gap-12">
			<!-- Left: Gallery + Features + Specs (Mobile: full width, Desktop: 60-67% width) -->
			<div class="w-full lg:w-3/5 xl:w-2/3">
				<div class="lg:sticky lg:top-20">
					<div class="flex flex-col gap-8">
						<!-- Image Gallery -->
						<ProductImageGallery {images} />

						<!-- Features and Specifications (Mobile: stacked, Desktop: side by side) -->
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
							{#if product.features?.length > 0}
								<div class="rounded-2xl border border-muted/60 bg-background/80 p-6 shadow-lg">
									<h3 class="mb-4 text-xl font-semibold">{m.product_features()}</h3>
									<ul class="list-disc space-y-2 pl-5 text-base text-muted-foreground">
										{#each product.features as feature}
											<li>{feature}</li>
										{/each}
									</ul>
								</div>
							{/if}
							{#if product.specifications && Object.keys(product.specifications).length > 0}
								<div class="rounded-2xl border border-muted/60 bg-background/80 p-6 shadow-lg">
									<h3 class="mb-4 text-xl font-semibold">{m.product_specifications()}</h3>
									<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
										{#each Object.entries(product.specifications) as [key, value]}
											<div class="font-medium capitalize">{key.replace(/_/g, ' ')}:</div>
											<div>{String(value)}</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Content (Mobile: full width, Desktop: 33-40% width) -->
			<div class="flex w-full flex-col gap-10 lg:w-2/5 xl:w-1/3">
				<!-- Guided Stepper -->
				<div class="flex w-full flex-col space-y-10">
					<!-- Product Info -->
					<div class="space-y-4">
						<h1 class="text-4xl font-bold tracking-tight">{product.name}</h1>
						<p class="text-2xl font-medium text-muted-foreground">
							{formatPrice(selectedVariant?.price || basePrice, currentLocale)}
						</p>
						{#if product.description}
							<p class="pt-2 text-lg text-muted-foreground">{product.description}</p>
						{/if}
					</div>
					<Separator class="my-8" />

					<!-- Step 1: Keyboard Model Selection -->
					<div class="space-y-6">
						<div class="flex items-center gap-3">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white"
							>
								1
							</div>
							<h2 class="text-2xl font-semibold">{m.product_model()}</h2>
						</div>
						<div class="grid grid-cols-1 gap-4">
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

					<!-- Step 2: Switch Selection (Only shown after keyboard selection) -->
					{#if selectedVariant}
						<div class="space-y-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white"
								>
									2
								</div>
								<h2 class="text-2xl font-semibold">{m.product_compatible_switches()}</h2>
							</div>
							{#if compatibleSwitches.length > 0}
								<div class="grid grid-cols-1 gap-4">
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
							{:else}
								<div class="rounded-lg border border-dashed bg-muted/50 p-6">
									<p class="text-center text-sm text-muted-foreground">
										{m.product_no_compatible_switches()}
									</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Step 3: Keycap Selection (Only shown after switch selection) -->
					{#if selectedSwitch}
						<div class="space-y-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white"
								>
									3
								</div>
								<h2 class="text-2xl font-semibold">{m.product_compatible_keycaps()}</h2>
							</div>
							{#if compatibleKeycaps.length > 0}
								<div class="grid grid-cols-1 gap-4">
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
							{:else}
								<div class="rounded-lg border border-dashed bg-muted/50 p-6">
									<p class="text-center text-sm text-muted-foreground">
										{m.product_no_compatible_keycaps()}
									</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Add to Cart Section (Always visible) -->
					<div class="mt-8 space-y-6">
						<!-- Configuration Summary -->
						<div class="rounded-2xl border border-muted/60 bg-background/80 p-6 shadow-lg">
							<h3 class="mb-4 text-xl font-semibold">{m.product_configuration_summary()}</h3>
							{#if selectedVariant || selectedSwitch || selectedKeycap}
								<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
									{#if selectedVariant}
										<div class="font-medium">{m.layout()}:</div>
										<div>{getVariantAttribute(selectedVariant, 'layout', 'N/A')}</div>
										<div class="font-medium">{m.keyboard_variant()}:</div>
										<div>{getVariantAttribute(selectedVariant, 'keyboard_variant', 'N/A')}</div>
									{/if}
									{#if selectedSwitch}
										<div class="font-medium">{m.switch_type()}:</div>
										<div>{getVariantAttribute(selectedSwitch, 'type', 'N/A')}</div>
										<div class="font-medium">{m.actuation_force()}:</div>
										<div>{getVariantAttribute(selectedSwitch, 'actuation_force', 'N/A')}</div>
										<div class="font-medium">{m.feel()}:</div>
										<div>{getVariantAttribute(selectedSwitch, 'feel', 'N/A')}</div>
									{/if}
									{#if selectedKeycap}
										<div class="font-medium">{m.legend_type()}:</div>
										<div>{getVariantAttribute(selectedKeycap, 'legend_type', 'N/A')}</div>
										<div class="font-medium">{m.material()}:</div>
										<div>{getVariantAttribute(selectedKeycap, 'material', 'N/A')}</div>
										<div class="font-medium">{m.color()}:</div>
										<div>{getVariantAttribute(selectedKeycap, 'color', 'N/A')}</div>
									{/if}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">{m.product_configure_prompt()}</p>
							{/if}
						</div>

						<!-- Add to Cart Button (Always visible) -->
						<form
							method="POST"
							action="?/addToCart"
							use:enhance={() => {
								isAddingToCart = true;
								return async ({ result }) => {
									handleAddToCartResult(result);
								};
							}}
							class="space-y-4"
						>
							<input type="hidden" name="productVariantId" value={selectedVariant?.id || ''} />
							<input type="hidden" name="quantity" value={quantity} />
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
								type="submit"
								size="lg"
								class="w-full rounded-xl py-6 text-lg font-semibold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 {canAddToCart
									? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-xl'
									: 'cursor-not-allowed bg-muted text-muted-foreground'}"
								disabled={!canAddToCart || isAddingToCart}
							>
								{#if isAddingToCart}
									<span
										class="mr-2 block h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
									></span>
									<span>{m.adding()}</span>
								{:else if addedToCart}
									<Check class="mr-2 h-5 w-5" />
									<span>{m.added_to_cart()}</span>
								{:else}
									<ShoppingCart class="mr-2 h-5 w-5" />
									<span>{getButtonText()}</span>
								{/if}
							</Button>
						</form>
					</div>
				</div>

				<!-- Configuration Summary & Details (always below stepper) -->
				<div class="flex flex-col gap-8">
					<!-- Configuration Summary moved above add to cart button -->
				</div>
			</div>
		</div>
	</div>
{/if}
