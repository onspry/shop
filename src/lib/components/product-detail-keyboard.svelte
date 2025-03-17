<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';

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
	const selectedOptions = $state<Record<string, string>>({});

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

	// Group accessory products by category
	const accessoryCategories = $derived(() => {
		const groupedProducts = new Map<string, Product[]>();
		accessoryProducts.forEach((product: Product) => {
			const category = product.category?.toUpperCase() || 'OTHER';
			if (!groupedProducts.has(category)) {
				groupedProducts.set(category, []);
			}
			groupedProducts.get(category)?.push(product);
		});
		return Array.from(groupedProducts.entries());
	});

	// Get keyboard variants from the passed variants prop
	const keyboardVariants = $derived(() => {
		return variants.filter((v: ProductVariant) => v.productId === product.id);
	});

	// Get accessory variants for a specific category
	function getAccessoryVariantsForCategory(category: string): ProductVariant[] {
		const productsInCategory = accessoryProducts.filter(
			(p: Product) => p.category?.toUpperCase() === category.toUpperCase()
		);
		const productIds = productsInCategory.map((p: Product) => p.id);

		return accessoryVariants.filter((v: ProductVariant) => productIds.includes(v.productId));
	}

	// Set default selected options
	$effect(() => {
		// Set default keyboard variant
		if (!selectedOptions['KEYBOARD'] && keyboardVariants().length > 0) {
			selectedOptions['KEYBOARD'] = keyboardVariants()[0].id;
		}

		// Set default options for each accessory category
		accessoryCategories().forEach(([category, products]) => {
			if (!selectedOptions[category]) {
				const variants = getAccessoryVariantsForCategory(category);
				if (variants.length > 0) {
					selectedOptions[category] = variants[0].id;
				}
			}
		});

		console.log('All accessory products:', accessoryProducts);
		console.log('Accessory categories found:', accessoryCategories());
		console.log('Accessory products by category:');
		accessoryCategories().forEach(([category, products]) => {
			console.log(`- ${category}:`, products);
		});
	});

	// Helper to get the selected variant for any category (including keyboard)
	function getSelectedVariant(category: string): ProductVariant | null {
		const selectedId = selectedOptions[category];
		if (!selectedId) return null;

		// For keyboard category, look in keyboard variants
		if (category === 'KEYBOARD') {
			return keyboardVariants().find((v: ProductVariant) => v.id === selectedId) || null;
		}

		// For accessory categories, look in accessory variants
		return accessoryVariants.find((v: ProductVariant) => v.id === selectedId) || null;
	}

	// Calculate total price
	const totalPrice = $derived(() => {
		let basePrice = product.price || 0;

		// Add keyboard variant price
		const keyboardVariant = getSelectedVariant('KEYBOARD');
		if (keyboardVariant) {
			basePrice += keyboardVariant.price;
		}

		// Add all accessory prices
		accessoryCategories().forEach(([category]) => {
			const selectedVariant = getSelectedVariant(category);
			if (selectedVariant) {
				basePrice += selectedVariant.price;
			}
		});

		return basePrice;
	});

	// Format price for display
	function formatPrice(price: number): string {
		return (price / 100).toFixed(2);
	}

	// Handle option selection
	function selectOption(category: string, variantId: string) {
		selectedOptions[category] = variantId;
	}

	// Add to cart function
	function addToCart() {
		// Create a configuration object with all selected options
		const configuration: Record<string, any> = {
			keyboard: product,
			keyboardVariant: getSelectedVariant('KEYBOARD')
		};

		// Add all accessory selections
		accessoryCategories().forEach(([category]) => {
			configuration[category.toLowerCase()] = getSelectedVariant(category);
		});

		// Build confirmation message
		let confirmationMessage = `Added ${product.name}`;
		if (getSelectedVariant('KEYBOARD')) {
			confirmationMessage += ` (${getSelectedVariant('KEYBOARD')?.name || 'Standard'})`;
		}

		accessoryCategories().forEach(([category]) => {
			const variant = getSelectedVariant(category);
			if (variant) {
				confirmationMessage += ` with ${variant.name}`;
			}
		});

		alert(confirmationMessage + ' to cart');
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

	// Helper function to render the accessory variant UI based on attributes only
	function renderAccessoryVariantUI(
		category: string,
		variant: ProductVariant
	): { icon: string; content: string } {
		// Get the variant attributes
		const attributes = (variant.attributes as Record<string, string>) || {};
		const variantName = variant.name.split(' - ')[1] || variant.name;

		// Extract common attributes that might be used for visualization
		const color = (attributes.color || '').toLowerCase();
		const type = (attributes.type || '').toLowerCase();
		const material = attributes.material || '';
		const legendType = attributes.legend_type || '';

		// Default content is either a specific attribute or the variant name
		const content = type || legendType || color || variantName;

		// Generate icon based on available attributes
		let icon = '';

		// If we have legend_type, show a grid of keys
		if (legendType) {
			let keysHtml = '';
			for (let i = 0; i < 9; i++) {
				let keyContent = '';
				if (legendType === 'Blank') {
					keyContent = '';
				} else if (legendType === 'Dots') {
					keyContent = '•';
				} else {
					keyContent = String.fromCharCode(65 + i);
				}

				keysHtml += `
					<div class="w-6 h-6 bg-gray-800 rounded-sm shadow-md flex items-center justify-center text-white text-xs">
						${keyContent}
					</div>
				`;
			}

			icon = `
				<div class="grid grid-cols-3 gap-1 mb-2">
					${keysHtml}
				</div>
			`;
		}
		// If we have type (like switch type) and color, show a colored box with type indicator
		else if (type && color) {
			// Map common colors to Tailwind classes
			let colorClass = 'bg-gray-500';
			if (color === 'red') colorClass = 'bg-red-500';
			else if (color === 'blue') colorClass = 'bg-blue-500';
			else if (color === 'brown') colorClass = 'bg-amber-700';
			else if (color === 'black') colorClass = 'bg-black';
			else if (color === 'white') colorClass = 'bg-white border border-gray-300';
			else if (color === 'green') colorClass = 'bg-green-500';
			else if (color === 'yellow') colorClass = 'bg-yellow-500';
			else if (color === 'purple') colorClass = 'bg-purple-500';
			else if (color === 'pink') colorClass = 'bg-pink-500';

			let typeSymbol = '•';
			if (type === 'linear') typeSymbol = '→';
			else if (type === 'tactile') typeSymbol = '↗';
			else if (type === 'clicky') typeSymbol = '↑';

			icon = `
				<div class="relative w-16 h-16 mb-2">
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="w-12 h-12 ${colorClass} rounded-md shadow-lg flex items-center justify-center text-white font-bold text-xl">
							${typeSymbol}
						</div>
					</div>
					<div class="absolute bottom-0 left-0 right-0 h-3 bg-gray-800 rounded-b-md"></div>
				</div>
			`;
		}
		// If we only have color (like for cases)
		else if (color) {
			// Map common colors to Tailwind classes
			let colorClass = 'bg-gray-500';
			if (color === 'red') colorClass = 'bg-red-500';
			else if (color === 'blue') colorClass = 'bg-blue-500';
			else if (color === 'brown') colorClass = 'bg-amber-700';
			else if (color === 'black') colorClass = 'bg-black';
			else if (color === 'white') colorClass = 'bg-white border border-gray-300';
			else if (color === 'green') colorClass = 'bg-green-500';
			else if (color === 'yellow') colorClass = 'bg-yellow-500';
			else if (color === 'purple') colorClass = 'bg-purple-500';
			else if (color === 'pink') colorClass = 'bg-pink-500';

			icon = `
				<div class="w-16 h-16 ${colorClass} rounded-md flex items-center justify-center mb-2 shadow-md">
					<span class="text-xs text-white">${material || category.substring(0, 4)}</span>
				</div>
			`;
		}
		// Default icon for variants without specific styling attributes
		else {
			icon = `
				<div class="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center mb-2">
					<span class="text-xs text-white">${category.substring(0, 4)}</span>
				</div>
			`;
		}

		return { icon, content };
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
											selectedOptions['KEYBOARD'] === keyboardOption.id
												? 'border-primary bg-primary/5 shadow-md'
												: 'border-muted hover:border-primary/50'
										}`}
										onclick={() => selectOption('KEYBOARD', keyboardOption.id)}
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
											{#if selectedOptions['KEYBOARD'] === keyboardOption.id}
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

				<!-- Dynamic Accessory Categories -->
				{#each accessoryCategories() as [category]}
					<div class="space-y-4">
						<div>
							<Label for={`category-${category.toLowerCase()}`}
								>{category.charAt(0) + category.slice(1).toLowerCase()} Type</Label
							>

							{#if isLoading}
								<div class="p-4 bg-muted rounded-md mt-2">
									<p class="text-sm text-muted-foreground">
										Loading {category.toLowerCase()} options...
									</p>
								</div>
							{:else}
								{@const categoryVariants = getAccessoryVariantsForCategory(category)}

								{#if categoryVariants.length > 0}
									<div
										class="grid grid-cols-3 gap-3 mt-2"
										id={`category-${category.toLowerCase()}`}
									>
										{#each categoryVariants as variantOption}
											{@const rendering = renderAccessoryVariantUI(category, variantOption)}

											<div
												class={`relative rounded-lg border p-4 transition-all ${
													selectedOptions[category] === variantOption.id
														? 'border-primary bg-primary/5 shadow-md'
														: 'border-muted hover:border-primary/50'
												}`}
												onclick={() => selectOption(category, variantOption.id)}
											>
												<div class="flex flex-col h-full">
													<div class="mb-3 flex justify-center">
														<div class="flex flex-col items-center justify-center">
															{@html rendering.icon}
															<span class="text-sm font-medium">{rendering.content}</span>
														</div>
													</div>
													<h3 class="text-sm font-medium mb-1 line-clamp-2">
														{variantOption.name.split(' - ')[1] || variantOption.name}
													</h3>
													<div class="text-sm font-bold mb-2">
														${(variantOption.price / 100).toFixed(2)}
													</div>
													{#if selectedOptions[category] === variantOption.id}
														<div class="absolute top-2 right-2">
															<div class="w-4 h-4 bg-primary rounded-full"></div>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="p-4 bg-muted rounded-md mt-2">
										<p class="text-sm text-muted-foreground">
											No {category.toLowerCase()} options available
										</p>
									</div>
								{/if}
							{/if}
						</div>
					</div>
				{/each}

				<div class="bg-muted p-4 rounded-md">
					<h3 class="font-medium mb-2">Selected Configuration</h3>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div>Keyboard:</div>
						<div>{product.name}</div>

						{#if keyboardVariants().length > 0}
							<div>Variant:</div>
							<div>
								{getSelectedVariant('KEYBOARD')?.name?.split(' - ')[1] ||
									getSelectedVariant('KEYBOARD')?.name ||
									'Standard'}
							</div>
						{/if}

						<!-- Dynamic accessory selections -->
						{#each accessoryCategories() as [category]}
							<div>{category.charAt(0) + category.slice(1).toLowerCase()}:</div>
							<div>
								{getSelectedVariant(category)?.name || `No ${category.toLowerCase()} selected`}
							</div>
						{/each}

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
