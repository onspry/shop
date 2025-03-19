<script lang="ts">
	import * as m from '$lib/paraglide/messages/en.js';
	import type { Product, ProductImage, ProductVariant } from '$lib/server/db';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import VariantCard from '$lib/components/ui/variant-card.svelte';

	interface CompatibilityResult {
		product: Product;
		variants: ProductVariant[];
		images: ProductImage[];
	}

	let {
		product,
		variants,
		images,
		requiredAccessories,
		optionalAccessories,
		requiredAccessoryCategories,
		optionalAccessoryCategories
	} = $props<{
		product: Product;
		variants: ProductVariant[];
		images: ProductImage[];
		requiredAccessories: Record<string, CompatibilityResult[]>;
		optionalAccessories: Record<string, CompatibilityResult[]>;
		requiredAccessoryCategories: string[];
		optionalAccessoryCategories: string[];
	}>();

	// State management for selected options
	// Initialize selections with keyboard and required accessories
	const initialSelections: Record<string, string> = {
		KEYBOARD: variants[0]?.id || ''
	};

	// Auto-select first variant of required accessories
	requiredAccessoryCategories.forEach((category: string) => {
		const upperCategory = category.toUpperCase();
		const accessories = requiredAccessories[upperCategory] || [];
		if (accessories[0]?.variants[0]?.id) {
			initialSelections[upperCategory] = accessories[0].variants[0].id;
		}
	});

	let selectedOptions = $state<Record<string, string>>(initialSelections);

	// Calculate total price only for selected items
	let totalPrice = $derived(() => {
		let total = 0;

		// Add keyboard price
		const keyboardVariant = getSelectedVariant('KEYBOARD');
		if (keyboardVariant) {
			total += keyboardVariant.price;
		}

		// Add required accessories prices
		requiredAccessoryCategories.forEach((category: string) => {
			const variant = getSelectedVariant(category);
			if (variant) {
				total += variant.price;
			}
		});

		// Add optional accessories prices (only if selected)
		optionalAccessoryCategories.forEach((category: string) => {
			const variant = getSelectedVariant(category);
			if (variant) {
				total += variant.price;
			}
		});

		return total;
	});

	// Select or unselect an option for a category
	function selectOption(category: string, variantId: string | null): void {
		const upperCategory = category.toUpperCase();
		if (variantId === null) {
			// Unselect the option
			const newOptions = { ...selectedOptions };
			delete newOptions[upperCategory];
			selectedOptions = newOptions;
		} else {
			// Select the option
			selectedOptions = { ...selectedOptions, [upperCategory]: variantId };
		}
	}

	// Check if a variant is selected
	function isVariantSelected(category: string, variantId: string): boolean {
		return selectedOptions[category.toUpperCase()] === variantId;
	}

	// Get selected variant for a category
	function getSelectedVariant(category: string): ProductVariant | undefined {
		const upperCaseCategory = category.toUpperCase();
		const selectedId = selectedOptions[upperCaseCategory];
		if (!selectedId) return undefined;

		if (upperCaseCategory === 'KEYBOARD') {
			return variants.find((v: ProductVariant) => v.id === selectedId);
		}

		const accessories =
			requiredAccessories[upperCaseCategory] || optionalAccessories[upperCaseCategory] || [];
		return accessories
			.flatMap((a: CompatibilityResult) => a.variants)
			.find((v: ProductVariant) => v.id === selectedId);
	}

	// Format price for display
	function formatPrice(price: number | (() => number)): string {
		const value = typeof price === 'function' ? price() : price;
		return (value / 100).toFixed(2);
	}

	// Helper function to get variant attribute value
	function getVariantAttribute(variant: ProductVariant, key: string): string {
		try {
			const attributes = variant.attributes as Record<string, unknown>;
			const value = attributes[key];
			return typeof value === 'string' ? value : '';
		} catch (e) {
			return '';
		}
	}

	// Handle image loading errors
	function handleImageError(event: Event) {
		const imgElement = event.target as HTMLImageElement;
		imgElement.src = `/placeholder-${product.category.toLowerCase()}.jpg`;
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
						{#each images as image}
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
					${formatPrice(totalPrice)}
				</p>
			</div>

			<Separator />

			<div class="space-y-2">
				<p class="text-muted-foreground">{product.description}</p>
			</div>

			<!-- Configuration Options -->
			<div class="space-y-6">
				<!-- Main keyboard section -->
				<div>
					<Label>{m.product_section_keyboard()}</Label>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
						{#each variants as variant}
							<VariantCard
								{variant}
								isSelected={selectedOptions['KEYBOARD'] === variant.id}
								onClick={() => selectOption('KEYBOARD', variant.id)}
								showPrice={true}
							/>
						{/each}
					</div>
				</div>

				<Separator />

				<!-- Required accessories -->
				{#each requiredAccessoryCategories as category}
					{@const upperCategory = category.toUpperCase()}
					{@const accessories = requiredAccessories[upperCategory] || []}
					<div>
						<Label>{m.required()} {category}</Label>
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
							{#each accessories as accessory}
								{#each accessory.variants as variant}
									<VariantCard
										{variant}
										isSelected={selectedOptions[upperCategory] === variant.id}
										onClick={() => selectOption(category, variant.id)}
										showPrice={true}
									/>
								{/each}
							{/each}
						</div>
					</div>
					<Separator />
				{/each}

				<!-- Optional accessories -->
				{#each optionalAccessoryCategories as category}
					{@const upperCategory = category.toUpperCase()}
					{@const accessories = optionalAccessories[upperCategory] || []}
					{#if accessories.length > 0}
						<div>
							<Label>{m.optional()} {category}</Label>
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
								{#each accessories as accessory}
									{#each accessory.variants as variant}
										<VariantCard
											{variant}
											isSelected={isVariantSelected(category, variant.id)}
											onClick={() =>
												selectOption(
													category,
													isVariantSelected(category, variant.id) ? null : variant.id
												)}
											showPrice={true}
										/>
									{/each}
								{/each}
							</div>
						</div>
						<Separator />
					{/if}
				{/each}

				<!-- Total price -->
				<div class="text-xl font-bold flex items-center justify-between">
					<span>{m.total()}</span>
					<span>${formatPrice(totalPrice)}</span>
				</div>

				<!-- Selected Options Summary -->
				<div class="bg-muted p-4 rounded-md mb-4">
					<h3 class="font-medium mb-2">Selected Options</h3>
					<div class="space-y-2">
						{#each Object.entries(selectedOptions) as [category, variantId]}
							{@const variant = getSelectedVariant(category)}
							{#if variant}
								<div class="text-sm">
									<div class="font-medium">
										{category.charAt(0) + category.slice(1).toLowerCase()}
									</div>
									<div class="text-muted-foreground">
										{#if category === 'SWITCHES'}
											{variant.name} - {getVariantAttribute(variant, 'type')},
											{getVariantAttribute(variant, 'actuation_force')} actuation
										{:else if category === 'KEYCAPS'}
											{variant.name} - {getVariantAttribute(variant, 'legend_type')}
											{getVariantAttribute(variant, 'material')}
										{:else}
											{variant.name}
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Add to cart button -->
				<Button onclick={() => console.log('Add to cart:', selectedOptions)} class="w-full">
					{m.addToCart()}
				</Button>

				<!-- Features -->
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

				<!-- Specifications -->
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
	</div>
</div>
