<script lang="ts">
	import type { ProductVariantViewModel } from '$lib/models/product';
	import { Card } from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPrice } from '$lib/utils/price';
	import { Check } from 'lucide-svelte';
	import { AppImage } from '$lib/components/ui/app-image';
	import { fade } from 'svelte/transition';
	import { getLocale } from '$lib/paraglide/runtime';

	let { variant, isSelected, onClick, showPrice, disabled } = $props<{
		variant: ProductVariantViewModel;
		isSelected: boolean;
		onClick: () => void;
		showPrice?: boolean;
		disabled?: boolean;
	}>();

	// Get the current locale
	const currentLocale = $derived(getLocale());

	// Helper function to get variant attribute value
	const getVariantAttribute = (key: string): string => {
		try {
			const value = variant.attributes[key];
			return typeof value === 'string' ? value : '';
		} catch (e) {
			return '';
		}
	};

	// Helper function to translate attribute name
	const getAttributeDisplay = (key: string): string => {
		// First try to look up translation using a standardized key format
		const prefixedKey = `variant_attribute_${key}`;

		// Check if the prefixed key exists in the messages object
		if (prefixedKey in m && typeof (m as any)[prefixedKey] === 'function') {
			// Call the translation function if it exists
			return (m as any)[prefixedKey]();
		}

		// Convert snake_case to camelCase for message lookup
		const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

		// Check if the camelCase key exists in messages
		if (camelCaseKey in m && typeof (m as any)[camelCaseKey] === 'function') {
			return (m as any)[camelCaseKey]();
		}

		// Then check if the direct key exists (like 'feel', 'color', etc.)
		if (key in m && typeof (m as any)[key] === 'function') {
			// Call the translation function if it exists
			return (m as any)[key]();
		}

		// For attributes without translations, format the key name
		return key
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	// Get variant image URL
	const variantImageUrl = $derived(getVariantAttribute('image_url') || '');

	// Check if variant is out of stock
	const isOutOfStock = $derived(variant.stockStatus === 'out_of_stock');

	// Handle click with stock check
	function handleClick() {
		if (!isOutOfStock && !disabled) {
			onClick();
		}
	}
</script>

<Card
	class={`relative rounded-lg border p-4 transition-all ${
		isSelected
			? 'border-primary bg-card shadow-sm'
			: 'border-muted bg-background hover:border-primary/50 hover:shadow-md'
	} ${isOutOfStock || disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'} transition-all duration-200`}
	onclick={handleClick}
>
	<div class="flex h-full flex-col">
		<!-- Stock Status Badge -->
		{#if variant.stockStatus === 'out_of_stock'}
			<div
				class="absolute left-2 top-2 rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground"
			>
				{m.product_out_of_stock()}
			</div>
		{:else if variant.stockStatus === 'low_stock'}
			<div
				class="bg-warning text-warning-foreground absolute left-2 top-2 rounded px-2 py-1 text-xs"
			>
				{m.product_low_stock()}
			</div>
		{/if}

		<!-- Variant Visual -->
		<div class="mb-3 flex justify-center">
			<div
				class="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md"
			>
				<AppImage
					src={variantImageUrl}
					alt={variant.name}
					width={64}
					height={64}
					className="h-full w-full group-hover:scale-110 transition-all duration-300"
					objectFit="cover"
				/>
			</div>
		</div>

		<!-- Variant Name -->
		<h3 class="mb-1 line-clamp-2">{variant.name}</h3>

		<!-- Variant Price -->
		{#if showPrice !== false}
			<div class="mb-2 flex items-center justify-between text-sm">
				<span class="font-bold">{formatPrice(Number(variant.price), currentLocale)}</span>
			</div>
		{/if}

		<!-- Selected Attributes -->
		{#if variant.attributes}
			<div class="mt-4 text-sm">
				{#each Object.entries(variant.attributes) as [key, value]}
					{#if !['compatibleWith', 'compatibility', 'image_url'].includes(key) && typeof value === 'string'}
						<div class="grid grid-cols-2 gap-1">
							<span class="capitalize text-muted-foreground">
								{getAttributeDisplay(key)}:
							</span>
							<span>{value}</span>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Selected Indicator -->
		{#if isSelected}
			<div class="absolute right-2 top-2" transition:fade={{ duration: 300 }}>
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-background"
				>
					<Check class="h-4 w-4 text-primary" />
				</div>
			</div>
		{/if}
	</div>
</Card>
