<script lang="ts">
	import type { ProductVariantViewModel } from '$lib/models/product';
	import { Card } from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages/en.js';
	import { formatPrice } from '$lib/utils/price';
	import { ImageOff, Check } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let { variant, isSelected, onClick, showPrice, disabled } = $props<{
		variant: ProductVariantViewModel;
		isSelected: boolean;
		onClick: () => void;
		showPrice?: boolean;
		disabled?: boolean;
	}>();

	// Image loading state
	let imageLoaded = $state(false);
	let imageError = $state(false);

	// Helper function to get variant attribute value
	const getVariantAttribute = (key: string): string => {
		try {
			const value = variant.attributes[key];
			return typeof value === 'string' ? value : '';
		} catch (e) {
			return '';
		}
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

	// Handle image load
	function handleImageLoad() {
		imageLoaded = true;
	}

	// Handle image error
	function handleImageError() {
		imageError = true;
	}
</script>

<Card
	class={`relative rounded-lg border p-4 transition-all ${
		isSelected
			? 'border-primary bg-card shadow-sm'
			: 'border-muted hover:border-primary/50 bg-background'
	} ${isOutOfStock || disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
	onclick={handleClick}
>
	<div class="flex flex-col h-full">
		<!-- Stock Status Badge -->
		{#if variant.stockStatus === 'out_of_stock'}
			<div
				class="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded"
			>
				{m.product_out_of_stock()}
			</div>
		{:else if variant.stockStatus === 'low_stock'}
			<div
				class="absolute top-2 left-2 bg-warning text-warning-foreground text-xs px-2 py-1 rounded"
			>
				{m.product_low_stock()}
			</div>
		{/if}

		<!-- Variant Visual -->
		<div class="mb-3 flex justify-center">
			<div class="relative w-16 h-16">
				{#if variantImageUrl && !imageError}
					{#if !imageLoaded}
						<div class="absolute inset-0 bg-muted animate-pulse rounded-md"></div>
					{/if}
					<img
						src={variantImageUrl}
						alt={variant.name}
						class="w-full h-full object-cover rounded-md"
						class:opacity-0={!imageLoaded}
						class:opacity-100={imageLoaded}
						onload={handleImageLoad}
						onerror={handleImageError}
					/>
				{:else}
					<div class="w-full h-full bg-muted rounded-md flex items-center justify-center">
						<ImageOff class="h-8 w-8 text-muted-foreground" />
					</div>
				{/if}
			</div>
		</div>

		<!-- Variant Name -->
		<h3 class="text-sm font-medium mb-1 line-clamp-2">
			{variant.name.split(' - ')[1] || variant.name}
		</h3>

		<!-- Variant Price -->
		{#if showPrice !== false}
			<div class="flex justify-between items-center text-sm mb-2">
				<span class="font-bold">{formatPrice(Number(variant.price))}</span>
			</div>
		{/if}

		<!-- Selected Attributes -->
		{#if variant.attributes}
			<div class="mt-4 text-sm">
				{#each Object.entries(variant.attributes) as [key, value]}
					{#if !['compatibleWith', 'compatibility', 'image_url'].includes(key) && typeof value === 'string'}
						<div class="grid grid-cols-2 gap-1">
							<span class="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
							<span>{value}</span>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Selected Indicator -->
		{#if isSelected}
			<div class="absolute top-2 right-2" transition:fade={{ duration: 300 }}>
				<div
					class="w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center"
				>
					<Check class="h-4 w-4 text-primary" />
				</div>
			</div>
		{/if}
	</div>
</Card>
