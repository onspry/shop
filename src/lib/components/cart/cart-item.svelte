<script lang="ts">
	import type { CartItemViewModel } from '$lib/models/cart';
	import { X, Minus, Plus, ImageOff, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';

	let {
		item,
		onQuantityChange,
		onRemove,
		disabled = false,
		isLoading = false,
		loadingAction = ''
	} = $props<{
		item: CartItemViewModel;
		onQuantityChange: (quantity: number) => void;
		onRemove: () => void;
		disabled?: boolean;
		isLoading?: boolean;
		loadingAction?: 'increment' | 'decrement' | 'remove' | '';
	}>();

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(item?.variant?.stock_quantity || 1);
	const quantity = $derived(item?.quantity || 0);
	const price = $derived(item?.price || 0);
	const variantName = $derived(item?.variant?.name || 'Product');
	const variantImage = $derived(item?.variant?.attributes?.image);

	let imageError = $state(false);
	let imageLoaded = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	function incrementQuantity() {
		if (disabled || quantity >= maxQuantity) return;
		onQuantityChange(quantity + 1);
	}

	function decrementQuantity() {
		if (disabled || quantity <= minQuantity) return;
		onQuantityChange(quantity - 1);
	}
</script>

<div class="flex border rounded-lg overflow-hidden bg-background">
	<div class="w-32 h-32 flex-shrink-0">
		<div class="relative aspect-square h-full overflow-hidden">
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
					class="h-full w-full object-cover transition-opacity duration-300"
					class:opacity-0={!imageLoaded}
					class:opacity-100={imageLoaded}
					onerror={handleImageError}
					onload={handleImageLoad}
				/>
			{/if}
		</div>
	</div>

	<div class="flex-1 p-4 flex flex-col justify-between">
		<div class="flex justify-between">
			<div>
				<h3 class="font-medium text-sm sm:text-base">{variantName}</h3>
				<p class="text-muted-foreground text-xs sm:text-sm">{formatPrice(price)}</p>
			</div>
			<div class="flex items-start">
				<button
					class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
					onclick={onRemove}
					disabled={disabled || isLoading}
					aria-label={m.cart_remove()}
				>
					{#if isLoading && loadingAction === 'remove'}
						<Loader2 class="h-5 w-5 animate-spin" />
					{:else}
						<X class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<div class="mt-4 flex justify-between items-center">
			<div class="flex items-center space-x-1">
				<button
					class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
					onclick={decrementQuantity}
					disabled={disabled || isLoading || quantity <= minQuantity}
					aria-label={m.cart_decrease_quantity()}
				>
					{#if isLoading && loadingAction === 'decrement'}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Minus class="h-4 w-4" />
					{/if}
				</button>

				<span class="w-8 text-center text-sm">{quantity}</span>

				<button
					class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
					onclick={incrementQuantity}
					disabled={disabled || isLoading || quantity >= maxQuantity}
					aria-label={m.cart_increase_quantity()}
				>
					{#if isLoading && loadingAction === 'increment'}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Plus class="h-4 w-4" />
					{/if}
				</button>
			</div>

			<div class="text-right">
				<span class="font-medium">{formatPrice(price * quantity)}</span>
			</div>
		</div>
	</div>
</div>
