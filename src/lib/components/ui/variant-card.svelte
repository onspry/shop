<script lang="ts">
	import type { ProductVariant } from '$lib/server/db/schema';

	let { variant, isSelected, onClick } = $props<{
		variant: ProductVariant;
		isSelected: boolean;
		onClick: () => void;
	}>();

	// Helper function to get variant attribute value
	const getVariantAttribute = (key: string): string => {
		try {
			const attributes = variant.attributes as Record<string, string>;
			return attributes[key] || '';
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
</script>

<div
	class={`relative rounded-lg border p-4 transition-all ${
		isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/50'
	}`}
	onclick={onClick}
>
	<div class="flex flex-col h-full">
		<!-- Variant Visual -->
		<div class="mb-3 flex justify-center">
			{#if switchType}
				<!-- Switch visualization -->
				<div class="flex flex-col items-center justify-center">
					<div class="relative w-16 h-16 mb-2">
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class={`w-12 h-12 ${getSwitchColorClass()} rounded-md shadow-lg flex items-center justify-center text-white font-bold text-xl`}
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
								class="w-6 h-6 bg-gray-800 rounded-sm shadow-md flex items-center justify-center text-white text-xs"
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
		<div class="text-sm font-bold mb-2">${formattedPrice}</div>

		<!-- Selected Indicator -->
		{#if isSelected}
			<div class="absolute top-2 right-2">
				<div class="w-4 h-4 bg-primary rounded-full"></div>
			</div>
		{/if}
	</div>
</div>
