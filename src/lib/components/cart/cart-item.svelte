<script lang="ts">
	import type { CartItemViewModel } from '$lib/types/cart';
	import { X, Minus, Plus, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import ImageWithSkeleton from '$lib/components/ui/image-with-skeleton.svelte';

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

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(item?.variant?.stock_quantity || 1);
	const quantity = $derived(item?.quantity || 0);
	const price = $derived(item?.price || 0);
	const variantName = $derived(item?.variant?.name || 'Product');
	const variantImage = $derived(item?.variant?.attributes?.image);

	// For loading states
	let incrementing = $state(false);
	let decrementing = $state(false);

	// Operation in progress indicator to disable all controls
	const isDisabled = $derived(disabled || incrementing || decrementing);

	async function incrementQuantity() {
		if (isDisabled || quantity >= maxQuantity) return;

		incrementing = true;
		try {
			onQuantityChange(quantity + 1);
		} finally {
			incrementing = false;
		}
	}

	async function decrementQuantity() {
		if (isDisabled || quantity <= minQuantity) return;

		decrementing = true;
		try {
			onQuantityChange(quantity - 1);
		} finally {
			decrementing = false;
		}
	}
</script>

<div class="flex border rounded-lg overflow-hidden bg-background">
	<div class="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
		<ImageWithSkeleton
			src={variantImage || '/placeholder.jpg'}
			alt={variantName}
			className="w-full h-full object-cover"
			aspectRatio="1:1"
		/>
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
					disabled={isDisabled}
					aria-label={m.cart_remove()}
				>
					{#if disabled}
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
					disabled={isDisabled || quantity <= minQuantity}
					aria-label={m.cart_decrease_quantity()}
				>
					{#if decrementing}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Minus class="h-4 w-4" />
					{/if}
				</button>

				<span class="w-8 text-center text-sm">{quantity}</span>

				<button
					class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
					onclick={incrementQuantity}
					disabled={isDisabled || quantity >= maxQuantity}
					aria-label={m.cart_increase_quantity()}
				>
					{#if incrementing}
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
