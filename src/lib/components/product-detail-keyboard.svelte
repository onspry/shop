<script lang="ts">
	import * as m from '$lib/paraglide/messages/en.js';
	import type {
		ProductViewModel,
		ProductVariantViewModel,
		ProductImageViewModel
	} from '$lib/types/product';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/ui/variant-card.svelte';
	import { formatPrice } from '$lib/utils/price';
	import { ProductCompatibilityService } from '$lib/utils/product-compatibility';
	import { browser } from '$app/environment';
	import { goto, pushState } from '$app/navigation';

	// Props
	let {
		product,
		variants,
		images,
		switches = [],
		keycaps = [],
		onvariantselect = () => {},
		onSwitchSelect = () => {},
		onKeycapSelect = () => {}
	} = $props<{
		product: ProductViewModel;
		variants: ProductVariantViewModel[];
		images: ProductImageViewModel[];
		switches?: ProductViewModel[];
		keycaps?: ProductViewModel[];
		onvariantselect?: (e: CustomEvent<{ variantId: string }>) => void;
		onSwitchSelect?: (switchId: string | null) => void;
		onKeycapSelect?: (keycapId: string | null) => void;
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

	// Initialize default variant
	$effect(() => {
		if (!currentVariantId && variants?.length > 0) {
			selectVariant(variants[0].id);
		}
	});

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

	// Add to cart function
	function addToCart() {
		if (!selectedVariant) return;
		// Implementation would depend on your cart store/system
		alert(`Added ${selectedVariant.name} to cart`);
	}

	// Image handling functions
	function handleImageLoad(event: Event) {
		const img = event.target as HTMLImageElement;
		loadedImages.add(img.src);
	}

	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		imgElement.src = `/placeholder-${product?.category?.toLowerCase() || 'default'}.jpg`;
	}

	function getOptimizedImageUrl(url: string, width: number, height: number): string {
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
					<div class="aspect-square overflow-hidden rounded-lg bg-muted relative">
						{#if !loadedImages.has(images[0].url)}
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="animate-pulse bg-muted-foreground/20 w-full h-full"></div>
							</div>
						{/if}
						<img
							data-src={getOptimizedImageUrl(images[0].url, 800, 800)}
							alt={images[0].alt}
							width={800}
							height={800}
							loading="lazy"
							class="h-full w-full object-cover object-center transition-opacity duration-300"
							class:opacity-0={!loadedImages.has(images[0].url)}
							class:opacity-100={loadedImages.has(images[0].url)}
							onload={handleImageLoad}
							onerror={handleImageError}
						/>
					</div>

					{#if images.length > 1}
						<div class="grid grid-cols-4 gap-2">
							{#each images.slice(1) as image}
								<div class="aspect-square overflow-hidden rounded-md bg-muted relative">
									{#if !loadedImages.has(image.url)}
										<div class="absolute inset-0 flex items-center justify-center">
											<div class="animate-pulse bg-muted-foreground/20 w-full h-full"></div>
										</div>
									{/if}
									<img
										data-src={getOptimizedImageUrl(image.url, 200, 200)}
										alt={image.alt}
										width={200}
										height={200}
										loading="lazy"
										class="h-full w-full object-cover object-center cursor-pointer hover:opacity-80 transition-opacity"
										class:opacity-0={!loadedImages.has(image.url)}
										class:opacity-100={loadedImages.has(image.url)}
										onload={handleImageLoad}
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
						<div class="text-muted-foreground">
							No compatible switches found for this keyboard variant.
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
						<div class="text-muted-foreground">
							No compatible keycaps found for this switch type.
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

				<div class="pt-4">
					<Button
						onclick={addToCart}
						class="w-full"
						disabled={!canAddToCart}
						aria-label={getButtonText()}
					>
						{getButtonText()}
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
