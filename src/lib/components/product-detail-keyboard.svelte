<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/ui/variant-card.svelte';
	import { onMount } from 'svelte';

	let {
		product,
		variants,
		images,
		accessoryProducts = [],
		accessoryVariants = [],
		accessoryImages = []
	} = $props<{
		product: Product;
		variants: ProductVariant[];
		images: ProductImage[];
		accessoryProducts?: Product[];
		accessoryVariants?: ProductVariant[];
		accessoryImages?: ProductImage[];
	}>();

	// State management for selected options
	let selectedKeyboardVariant = $state<string | null>(null);
	let selectedSwitchType = $state<string | null>(null);
	let selectedKeycapStyle = $state<string | null>(null);

	// Debug logging
	onMount(() => {
		console.log('Product Detail Keyboard Component Mounted');
		console.log('Product:', product);
		console.log('Variants:', variants);
		console.log('Images:', images);
		console.log('Accessory Products:', accessoryProducts);
		console.log('Accessory Variants:', accessoryVariants);
	});

	// Loading state
	const isLoading = $state(false);

	// Get all products (main + accessories)
	const allProducts = $derived(() => {
		return [product, ...accessoryProducts];
	});

	// Get all variants (main + accessories)
	const allVariants = $derived(() => {
		return [...variants, ...accessoryVariants];
	});

	// Get all products categories for debugging
	const allProductCategories = $derived(() => {
		return allProducts().map((p: Product) => p.category);
	});

	// Get switch product from accessory products
	const switchesProduct = $derived(() => {
		return accessoryProducts.find((p: Product) => p.category?.toUpperCase() === 'SWITCHES');
	});

	// Get keycap product from accessory products
	const keycapsProduct = $derived(() => {
		return accessoryProducts.find((p: Product) => p.category?.toUpperCase() === 'KEYCAPS');
	});

	// Get keyboard variants from the passed variants prop
	const keyboardVariants = $derived(() => {
		// Filter variants that belong to the keyboard product
		return variants.filter((v: ProductVariant) => v.productId === product.id);
	});

	// Get switch variants from accessory variants
	const switchVariants = $derived(() => {
		const switchProduct = switchesProduct();
		if (!switchProduct || !switchProduct.id) return [];
		return accessoryVariants.filter((v: ProductVariant) => v.productId === switchProduct.id);
	});

	// Get keycap variants from accessory variants
	const keycapVariants = $derived(() => {
		const keycapProduct = keycapsProduct();
		if (!keycapProduct || !keycapProduct.id) return [];
		return accessoryVariants.filter((v: ProductVariant) => v.productId === keycapProduct.id);
	});

	// Debug logging for derived values
	$effect(() => {
		console.log('All Products:', allProducts());
		console.log('All Products Categories:', allProductCategories());
		console.log('Switches Product:', switchesProduct());
		console.log('Keycaps Product:', keycapsProduct());
		console.log('Keyboard Variants:', keyboardVariants());
		console.log('Switch Variants:', switchVariants());
		console.log('Keycap Variants:', keycapVariants());
	});

	// Set default selected options
	$effect(() => {
		if (!selectedKeyboardVariant && keyboardVariants().length > 0) {
			selectedKeyboardVariant = keyboardVariants()[0].id;
		}

		if (!selectedSwitchType && switchVariants().length > 0) {
			const redSwitch = switchVariants().find(
				(v: ProductVariant) =>
					v.attributes && typeof v.attributes === 'object' && v.attributes.color === 'Red'
			);
			selectedSwitchType = redSwitch ? redSwitch.id : switchVariants()[0].id;
		}

		if (!selectedKeycapStyle && keycapVariants().length > 0) {
			const characterKeycaps = keycapVariants().find(
				(v: ProductVariant) =>
					v.attributes &&
					typeof v.attributes === 'object' &&
					v.attributes.legend_type === 'Characters'
			);
			selectedKeycapStyle = characterKeycaps ? characterKeycaps.id : keycapVariants()[0].id;
		}
	});

	// Get the selected keyboard, switch and keycap options
	const selectedKeyboard = $derived(() => {
		return (
			keyboardVariants().find((k: ProductVariant) => k.id === selectedKeyboardVariant) ||
			(keyboardVariants().length > 0 ? keyboardVariants()[0] : null)
		);
	});

	const selectedSwitch = $derived(() => {
		return (
			switchVariants().find((s: ProductVariant) => s.id === selectedSwitchType) ||
			(switchVariants().length > 0 ? switchVariants()[0] : null)
		);
	});

	const selectedKeycap = $derived(() => {
		return (
			keycapVariants().find((k: ProductVariant) => k.id === selectedKeycapStyle) ||
			(keycapVariants().length > 0 ? keycapVariants()[0] : null)
		);
	});

	// Calculate total price
	const totalPrice = $derived(() => {
		let baseKeyboardPrice = product.price || 0;
		const keyboardVariantPrice = selectedKeyboard()?.price || 0;
		const switchPrice = selectedSwitch()?.price || 0;
		const keycapPrice = selectedKeycap()?.price || 0;

		return baseKeyboardPrice + keyboardVariantPrice + switchPrice + keycapPrice;
	});

	// Format price for display
	function formatPrice(price: number): string {
		return (price / 100).toFixed(2);
	}

	// Handle option selection
	function selectKeyboardVariant(variant: string) {
		selectedKeyboardVariant = variant;
	}

	function selectSwitchType(type: string) {
		selectedSwitchType = type;
	}

	function selectKeycapStyle(style: string) {
		selectedKeycapStyle = style;
	}

	// Add to cart function
	function addToCart() {
		// Implementation would depend on your cart store/system
		console.log('Adding to cart:', {
			keyboard: product,
			keyboardVariant: selectedKeyboard(),
			switch: selectedSwitch(),
			keycap: selectedKeycap()
		});
		alert(
			`Added ${product.name} (${selectedKeyboard()?.name || 'Standard'}) with ${selectedSwitch()?.name || 'No switch'} and ${selectedKeycap()?.name || 'No keycap'} to cart`
		);
	}

	// Add this function to handle image loading errors
	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		imgElement.src = '/placeholder-keyboard.jpg';
	}

	// Helper function to get variant attribute
	function getVariantAttribute(variant: ProductVariant | null, key: string): string {
		if (!variant || !variant.attributes) return '';
		try {
			const attributes = variant.attributes as Record<string, string>;
			return attributes[key] || '';
		} catch (e) {
			return '';
		}
	}

	// Helper function to get switch color class
	function getSwitchColorClass(variant: ProductVariant | null): string {
		if (!variant) return 'bg-gray-500';

		const color = getVariantAttribute(variant, 'color').toLowerCase();
		switch (color) {
			case 'red':
				return 'bg-red-500';
			case 'blue':
				return 'bg-blue-500';
			case 'brown':
				return 'bg-amber-700';
			default:
				return 'bg-gray-500';
		}
	}

	// Helper function to get switch type display
	function getSwitchTypeDisplay(variant: ProductVariant | null): string {
		if (!variant) return '•';

		const type = getVariantAttribute(variant, 'type').toLowerCase();
		switch (type) {
			case 'linear':
				return '→';
			case 'tactile':
				return '↗';
			case 'clicky':
				return '↑';
			default:
				return '•';
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Product Images -->
		<div class="space-y-4">
			{#if images.length > 0}
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
					${formatPrice(totalPrice())}
				</p>
			</div>

			<Separator />

			<div class="space-y-2">
				<p class="text-muted-foreground">{product.description}</p>
			</div>

			<!-- Keyboard Configuration Options -->
			<div class="space-y-6">
				<!-- Keyboard Variant Selection -->
				{#if keyboardVariants().length > 0}
					<div class="space-y-4">
						<div>
							<Label for="keyboard-variant">Keyboard Variant</Label>
							<div class="grid grid-cols-2 gap-3 mt-2" id="keyboard-variant">
								{#each keyboardVariants() as keyboardOption}
									<div
										class={`relative rounded-lg border p-4 transition-all ${
											selectedKeyboardVariant === keyboardOption.id
												? 'border-primary bg-primary/5 shadow-md'
												: 'border-muted hover:border-primary/50'
										}`}
										onclick={() => selectKeyboardVariant(keyboardOption.id)}
									>
										<div class="flex flex-col h-full">
											<div class="mb-3 flex justify-center">
												<div class="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
													<span class="text-xs text-muted-foreground">
														{getVariantAttribute(keyboardOption, 'layout') || 'Keyboard'}
													</span>
												</div>
											</div>
											<h3 class="text-sm font-medium mb-1 line-clamp-2">
												{keyboardOption.name.split(' - ')[1] || keyboardOption.name}
											</h3>
											<div class="text-sm font-bold mb-2">
												${(keyboardOption.price / 100).toFixed(2)}
											</div>
											{#if selectedKeyboardVariant === keyboardOption.id}
												<div class="absolute top-2 right-2">
													<div class="w-4 h-4 bg-primary rounded-full"></div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Switch Type Selection -->
				<div class="space-y-4">
					<div>
						<Label for="switch-type">Switch Type</Label>
						{#if isLoading || switchVariants().length === 0}
							<div class="p-4 bg-muted rounded-md mt-2">
								<p class="text-sm text-muted-foreground">Loading switch options...</p>
							</div>
						{:else}
							<div class="grid grid-cols-3 gap-3 mt-2" id="switch-type">
								{#each switchVariants() as switchOption}
									<div
										class={`relative rounded-lg border p-4 transition-all ${
											selectedSwitchType === switchOption.id
												? 'border-primary bg-primary/5 shadow-md'
												: 'border-muted hover:border-primary/50'
										}`}
										onclick={() => selectSwitchType(switchOption.id)}
									>
										<div class="flex flex-col h-full">
											<div class="mb-3 flex justify-center">
												<div class="flex flex-col items-center justify-center">
													<div class="relative w-16 h-16 mb-2">
														<div class="absolute inset-0 flex items-center justify-center">
															<div
																class={`w-12 h-12 ${getSwitchColorClass(switchOption)} rounded-md shadow-lg flex items-center justify-center text-white font-bold text-xl`}
															>
																{getSwitchTypeDisplay(switchOption)}
															</div>
														</div>
														<div
															class="absolute bottom-0 left-0 right-0 h-3 bg-gray-800 rounded-b-md"
														></div>
													</div>
												</div>
											</div>
											<h3 class="text-sm font-medium mb-1 line-clamp-2">
												{switchOption.name.split(' - ')[1] || switchOption.name}
											</h3>
											<div class="text-sm font-bold mb-2">
												${(switchOption.price / 100).toFixed(2)}
											</div>
											{#if selectedSwitchType === switchOption.id}
												<div class="absolute top-2 right-2">
													<div class="w-4 h-4 bg-primary rounded-full"></div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Keycap Style Selection -->
				<div class="space-y-4">
					<div>
						<Label for="keycap-style">Keycap Style</Label>
						{#if isLoading || keycapVariants().length === 0}
							<div class="p-4 bg-muted rounded-md mt-2">
								<p class="text-sm text-muted-foreground">Loading keycap options...</p>
							</div>
						{:else}
							<div class="grid grid-cols-3 gap-3 mt-2" id="keycap-style">
								{#each keycapVariants() as keycapOption}
									<div
										class={`relative rounded-lg border p-4 transition-all ${
											selectedKeycapStyle === keycapOption.id
												? 'border-primary bg-primary/5 shadow-md'
												: 'border-muted hover:border-primary/50'
										}`}
										onclick={() => selectKeycapStyle(keycapOption.id)}
									>
										<div class="flex flex-col h-full">
											<div class="mb-3 flex justify-center">
												<div class="flex flex-col items-center justify-center">
													<div class="grid grid-cols-3 gap-1 mb-2">
														{#each Array(9) as _, i}
															<div
																class="w-6 h-6 bg-gray-800 rounded-sm shadow-md flex items-center justify-center text-white text-xs"
															>
																{getVariantAttribute(keycapOption, 'legend_type') === 'Blank'
																	? ''
																	: getVariantAttribute(keycapOption, 'legend_type') === 'Dots'
																		? '•'
																		: String.fromCharCode(65 + i)}
															</div>
														{/each}
													</div>
												</div>
											</div>
											<h3 class="text-sm font-medium mb-1 line-clamp-2">
												{keycapOption.name.split(' - ')[1] || keycapOption.name}
											</h3>
											<div class="text-sm font-bold mb-2">
												${(keycapOption.price / 100).toFixed(2)}
											</div>
											{#if selectedKeycapStyle === keycapOption.id}
												<div class="absolute top-2 right-2">
													<div class="w-4 h-4 bg-primary rounded-full"></div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="bg-muted p-4 rounded-md">
					<h3 class="font-medium mb-2">Selected Configuration</h3>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div>Keyboard:</div>
						<div>{product.name}</div>

						{#if keyboardVariants().length > 0}
							<div>Variant:</div>
							<div>
								{selectedKeyboard()?.name?.split(' - ')[1] ||
									selectedKeyboard()?.name ||
									'Standard'}
							</div>
						{/if}

						<div>Switch Type:</div>
						<div>{selectedSwitch()?.name || 'Loading...'}</div>

						<div>Keycap Style:</div>
						<div>{selectedKeycap()?.name || 'Loading...'}</div>

						<div>Total Price:</div>
						<div>${formatPrice(totalPrice())}</div>
					</div>
				</div>

				<Button onclick={addToCart} class="w-full">
					{m.product_add_to_cart ? m.product_add_to_cart() : 'Add to Cart'}
				</Button>
			</div>

			{#if product.features && product.features.length > 0}
				<div class="space-y-2">
					<h3 class="text-lg font-medium">
						{m.product_features ? m.product_features() : 'Features'}
					</h3>
					<ul class="list-disc pl-5 space-y-1">
						{#each product.features as feature}
							<li>{feature}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if product.specifications && Object.keys(product.specifications).length > 0}
				<div class="space-y-2">
					<h3 class="text-lg font-medium">
						{m.product_specifications ? m.product_specifications() : 'Specifications'}
					</h3>
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
</div>
