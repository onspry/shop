<script lang="ts">
	import type { ProductVariantViewModel } from '$lib/types/product';
	import { Card } from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages/en.js';

	let { variant, isSelected, onClick, showPrice } = $props<{
		variant: ProductVariantViewModel;
		isSelected: boolean;
		onClick: () => void;
		showPrice?: boolean;
	}>();

	// Helper function to get variant attribute value
	const getVariantAttribute = (key: string): string => {
		try {
			const value = variant.attributes[key];
			return typeof value === 'string' ? value : '';
		} catch (e) {
			return '';
		}
	};

	// Format price for display
	const formattedPrice = $derived((Number(variant.price) / 100).toFixed(2));

	// Get variant type and color for switches
	const switchType = $derived(
		getVariantAttribute('type') || getVariantAttribute('switch_type')?.split(' ').pop() || ''
	);
	const switchColor = $derived(getVariantAttribute('color') || '');

	// Get variant legend type for keycaps
	const legendType = $derived(
		getVariantAttribute('legend_type') || getVariantAttribute('keycap_style') || ''
	);

	// Check if variant is out of stock
	const isOutOfStock = $derived(variant.stockStatus === 'out_of_stock');

	// Helper function to get color class based on switch type
	const getSwitchColorClass = (): string => {
		const color = switchColor.toLowerCase();

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
	};

	// Helper function to get switch type icon/display
	const getSwitchTypeDisplay = (): string => {
		const type = switchType.toLowerCase();

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
	};

	// Handle click with stock check
	function handleClick() {
		if (!isOutOfStock) {
			onClick();
		}
	}
</script>

<Card
	class={`relative rounded-lg border p-4 transition-all ${
		isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/50'
	} ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
			{#if switchType}
				<!-- Switch visualization -->
				<div class="flex flex-col items-center justify-center">
					<div class="relative w-16 h-16 mb-2">
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class={`w-12 h-12 ${getSwitchColorClass()} rounded-md shadow-lg flex items-center justify-center text-white font-bold text-xl ${
									isOutOfStock ? 'opacity-50' : ''
								}`}
							>
								{getSwitchTypeDisplay()}
							</div>
						</div>
						<div class="absolute bottom-0 left-0 right-0 h-3 bg-gray-800 rounded-b-md"></div>
					</div>
				</div>
			{:else if legendType}
				<!-- Keycap visualization -->
				<div class="flex flex-col items-center justify-center">
					<div class="grid grid-cols-3 gap-1 mb-2">
						{#each Array(9) as _, i}
							<div
								class="w-6 h-6 bg-gray-800 rounded-sm shadow-md flex items-center justify-center text-white text-xs ${isOutOfStock
									? 'opacity-50'
									: ''}"
							>
								{legendType === 'Blank'
									? ''
									: legendType === 'Dots'
										? '•'
										: String.fromCharCode(65 + i)}
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Generic visualization -->
				<div class="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
					<span class="text-xs text-muted-foreground">Variant</span>
				</div>
			{/if}
		</div>

		<!-- Variant Name -->
		<h3 class="text-sm font-medium mb-1 line-clamp-2">
			{variant.name.split(' - ')[1] || variant.name}
		</h3>

		<!-- Variant Price -->
		{#if showPrice !== false}
			<div class="flex justify-between items-center text-sm mb-2">
				<span class="font-bold">${formattedPrice}</span>
			</div>
		{/if}

		<!-- Selected Attributes -->
		{#if variant.attributes}
			<div class="mt-4 text-sm">
				{#each Object.entries(variant.attributes) as [key, value]}
					{#if !['compatibleWith', 'compatibility'].includes(key) && typeof value === 'string'}
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
			<div class="absolute top-2 right-2">
				<div class="w-4 h-4 bg-primary rounded-full"></div>
			</div>
		{/if}
	</div>
</Card>
