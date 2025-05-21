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
	<div class="py-8">
		<div class="grid grid-cols-1 items-start gap-x-12 md:grid-cols-5 lg:gap-x-16">
			<!-- Left Column: Sticky Product Image -->
			<div class="flex items-start justify-center md:sticky md:top-20 md:col-span-3 md:self-start">
				<div class="min-h-[400px] w-full max-w-2xl rounded-2xl md:min-h-[500px]">
					<ProductImageGallery {images} />
				</div>
			</div>

			<!-- Right Column: Options and Details -->
			<div class="flex flex-col space-y-10 pt-8 md:col-span-2 md:pt-0">
				<!-- Product Info -->
				<div class="space-y-2">
					<h1>{product.name}</h1>
					<p class="text-xl font-medium text-muted-foreground lg:text-2xl">
						{formatPrice(selectedVariant?.price || basePrice, currentLocale)}
					</p>
					{#if product.description}
						<p class="pt-2 text-base text-muted-foreground">{product.description}</p>
					{/if}
				</div>

				<Separator />

				<!-- Keyboard Variants (Model Selection) -->
				<div class="space-y-4">
					<h2>
						{m.product_model()}
					</h2>
					<div class="grid grid-cols-1 gap-3">
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

				<!-- Switch Options -->
				{#if compatibleSwitches.length > 0}
					<div class="space-y-4">
						<h2>{m.product_compatible_switches()}</h2>
						<div class="grid grid-cols-1 gap-3">
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
				{:else if selectedVariant}
					<div
						class="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-6"
					>
						<p class="text-center text-sm text-muted-foreground">
							{m.product_no_compatible_switches()}
						</p>
					</div>
				{/if}

				<!-- Keycap Options -->
				{#if compatibleKeycaps.length > 0}
					<div class="space-y-4">
						<h2>{m.product_compatible_keycaps()}</h2>
						<div class="grid grid-cols-1 gap-3">
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
				{:else if selectedSwitch}
					<div
						class="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-6"
					>
						<p class="text-center text-sm text-muted-foreground">
							{m.product_no_compatible_keycaps()}
						</p>
					</div>
				{/if}

				<!-- Selected Options Summary (Optional, can be integrated or removed) -->
				{#if selectedVariant}
					<div class="border-t pt-6">
						<div class="rounded-md border bg-muted/50 p-4">
							<h3 class="mb-3">{m.product_configuration_summary()}</h3>
							<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
								<div>{m.layout()}:</div>
								<div>{getVariantAttribute(selectedVariant, 'layout', 'N/A')}</div>
								<div>{m.keyboard_variant()}:</div>
								<div>{getVariantAttribute(selectedVariant, 'keyboard_variant', 'N/A')}</div>
								{#if selectedSwitch}
									<div>{m.switch_type()}:</div>
									<div>{getVariantAttribute(selectedSwitch, 'type', 'N/A')}</div>
									<div>{m.actuation_force()}:</div>
									<div>{getVariantAttribute(selectedSwitch, 'actuation_force', 'N/A')}</div>
									<div>{m.feel()}:</div>
									<div>{getVariantAttribute(selectedSwitch, 'feel', 'N/A')}</div>
								{/if}
								{#if selectedKeycap}
									<div>{m.legend_type()}:</div>
									<div>{getVariantAttribute(selectedKeycap, 'legend_type', 'N/A')}</div>
									<div>{m.material()}:</div>
									<div>{getVariantAttribute(selectedKeycap, 'material', 'N/A')}</div>
									<div>{m.color()}:</div>
									<div>{getVariantAttribute(selectedKeycap, 'color', 'N/A')}</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Add to Cart Section -->
				<div class="space-y-6 border-t pt-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">{m.product_quantity()}</span>
						<div
							class="flex items-center space-x-1 rounded-md border bg-muted/30 p-1 dark:bg-muted/20"
						>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7"
								onclick={() => quantity > 1 && (quantity -= 1)}
								disabled={quantity <= 1 || isAddingToCart}
								aria-label={m.decrease_quantity()}><Minus class="h-4 w-4" /></Button
							>
							<span class="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7"
								onclick={() => (quantity += 1)}
								disabled={isAddingToCart}
								aria-label={m.increase_quantity()}><Plus class="h-4 w-4" /></Button
							>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-base font-medium">{m.product_total()}</span>
						<span class="text-2xl font-bold">
							{selectedVariant
								? formatPrice(selectedVariant.price * quantity, currentLocale)
								: '--'}
						</span>
					</div>

					<form
						method="POST"
						action="?/addToCart"
						class="space-y-4"
						use:enhance={() => {
							isAddingToCart = true;
							const toastId = toast.loading(`Adding ${product.name} to cart...`, {
								duration: 30000
							});
							return async ({ result }) => {
								toast.dismiss(toastId);
								handleAddToCartResult(result);
							};
						}}
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
							class="w-full"
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

						{#if addedToCart}
							<div class="mt-3 flex justify-between gap-3">
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
					</form>
				</div>

				<!-- Features and Specifications (Optional) -->
				{#if product.features?.length > 0 || (product.specifications && Object.keys(product.specifications).length > 0)}
					<div class="space-y-6 border-t pt-6">
						{#if product.features?.length > 0}
							<div class="space-y-2">
								<h3>{m.product_features()}</h3>
								<ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
									{#each product.features as feature}
										<li>{feature}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if product.specifications && Object.keys(product.specifications).length > 0}
							<div class="space-y-2">
								<h3>{m.product_specifications()}</h3>
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
