<script lang="ts">
	import type { CartItemViewModel } from '$lib/models/cart';
	import { Trash2, Minus, Plus, ImageOff, Tag } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import Button from './ui/button/button.svelte';

	let {
		item,
		onQuantityChange,
		onRemove,
		disabled = false
	} = $props<{
		item: CartItemViewModel;
		onQuantityChange: (quantity: number) => void;
		onRemove: () => void;
		disabled?: boolean;
	}>();

	// Track if remove confirmation is shown
	let showRemoveConfirm = $state(false);

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(item?.variant?.stock_quantity || 1);
	const quantity = $derived(item?.quantity || 0);
	const price = $derived(item?.price || 0);
	const variantName = $derived(item?.variant?.name || 'Product');
	const variantImage = $derived(item?.variant?.attributes?.image);

	// Get variant attributes for display
	const variantAttributes = $derived(getVariantAttributes());

	// Helper function to extract variant attributes
	function getVariantAttributes() {
		const attrs = [];
		if (item?.variant?.attributes) {
			for (const [key, value] of Object.entries(item.variant.attributes)) {
				// Skip the image attribute
				if (key !== 'image' && value) {
					attrs.push(`${key}: ${value}`);
				}
			}
		}
		return attrs;
	}

	let imageError = $state(false);
	let imageLoaded = $state(false);
	let isUpdating = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	function incrementQuantity() {
		if (disabled || quantity >= maxQuantity || isUpdating) return;
		isUpdating = true;
		onQuantityChange(quantity + 1);
		// Reset updating state after a short delay
		setTimeout(() => isUpdating = false, 300);
	}

	function decrementQuantity() {
		if (disabled || quantity <= minQuantity || isUpdating) return;
		isUpdating = true;
		onQuantityChange(quantity - 1);
		// Reset updating state after a short delay
		setTimeout(() => isUpdating = false, 300);
	}

	function handleRemove() {
		if (disabled || isUpdating) return;

		if (showRemoveConfirm) {
			isUpdating = true;
			onRemove();
			// Reset state after a short delay
			setTimeout(() => {
				isUpdating = false;
				showRemoveConfirm = false;
			}, 300);
		} else {
			showRemoveConfirm = true;
			// Auto-hide confirmation after 3 seconds if not clicked
			setTimeout(() => showRemoveConfirm = false, 3000);
		}
	}

	// Cancel remove action (used in button click handler)
	function cancelRemove() {
		showRemoveConfirm = false;
	}
</script>

<div class="relative">
	<div class="flex bg-background rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
		<!-- Product Image with hover zoom -->
		<div class="w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-md border border-gray-100 group">
			<div class="relative aspect-square h-full overflow-hidden bg-muted/5">
				{#if imageError}
					<div class="absolute inset-0 flex items-center justify-center bg-muted">
						<ImageOff class="h-8 w-8 text-muted-foreground" />
					</div>
				{:else}
					{#if !imageLoaded}
						<div class="absolute inset-0">
							<div class="h-full w-full animate-pulse bg-muted-foreground/20"></div>
						</div>
					{/if}
					<img
						src={variantImage}
						alt={variantName}
						class="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
						class:opacity-0={!imageLoaded}
						class:opacity-100={imageLoaded}
						onerror={handleImageError}
						onload={handleImageLoad}
					/>
				{/if}
			</div>
		</div>

		<div class="flex-1 pl-6 flex flex-col justify-between">
			<div class="flex justify-between">
				<div>
					<h3 class="font-medium text-base">{variantName}</h3>

					<!-- Variant Attributes -->
					{#if variantAttributes.length > 0}
						<div class="mt-1 flex flex-wrap gap-2">
							{#each variantAttributes as attr}
								<span class="inline-flex items-center text-xs bg-muted/30 px-2 py-0.5 rounded text-muted-foreground">
									<Tag class="h-3 w-3 mr-1" />
									{attr}
								</span>
							{/each}
						</div>
					{/if}

					<!-- Composite Items -->
					{#if item.composites && item.composites.length > 0}
						<div class="mt-2 space-y-1">
							{#each item.composites as composite}
								<p class="text-sm text-muted-foreground">{composite.name}</p>
							{/each}
						</div>
					{/if}

					<!-- Stock Status -->
					{#if item.variant.stockStatus === 'low_stock'}
						<p class="text-xs text-warning mt-1">Only {item.variant.stock_quantity} left in stock</p>
					{:else if item.variant.stockStatus === 'in_stock'}
						<p class="text-xs text-green-600 mt-1">In Stock</p>
					{/if}
				</div>

				<!-- Remove Button -->
				<div class="flex items-start gap-1">
					{#if showRemoveConfirm}
						<Button
							class="p-2 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 group"
							variant="ghost"
							onclick={handleRemove}
							disabled={disabled || isUpdating}
							aria-label="Confirm removal"
						>
							<div class="flex items-center">
								<span class="text-xs font-medium mr-1">Confirm</span>
								<Trash2 class="h-4 w-4" />
							</div>
						</Button>
						<Button
							class="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
							variant="ghost"
							onclick={cancelRemove}
							disabled={disabled || isUpdating}
							aria-label="Cancel removal"
						>
							<span class="text-xs">Cancel</span>
						</Button>
					{:else}
						<Button
							class="p-2 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 group"
							variant="ghost"
							onclick={handleRemove}
							disabled={disabled || isUpdating}
							aria-label={m.cart_remove()}
						>
							<Trash2 class="h-5 w-5 group-hover:scale-110 transition-transform" />
						</Button>
					{/if}
				</div>
			</div>

			<div class="mt-4 flex justify-between items-center">
				<!-- Improved Quantity Controls -->
				<div class="flex items-center space-x-2 bg-muted/10 rounded-md p-1.5 border border-gray-100">
					<Button
						class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						variant="ghost"
						onclick={decrementQuantity}
						disabled={disabled || isUpdating || quantity <= minQuantity}
						aria-label={m.cart_decrease_quantity()}
					>
						<Minus class="h-4 w-4" />
					</Button>

					<span class="w-8 text-center text-sm font-medium">{quantity}</span>

					<Button
						class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						variant="ghost"
						onclick={incrementQuantity}
						disabled={disabled || isUpdating || quantity >= maxQuantity}
						aria-label={m.cart_increase_quantity()}
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>

				<!-- Price -->
				<div class="text-right">
					<span class="font-medium text-lg">{formatPrice(price * quantity)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
