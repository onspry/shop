<script lang="ts">
	import type { CartItemViewModel } from '$lib/models/cart';
	import { Trash2, Minus, Plus, ImageOff } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { cart } from '$lib/stores/cart';

	let {
		item,
		disabled = false
	} = $props<{
		item: CartItemViewModel;
		disabled?: boolean;
	}>();

	// Track if remove confirmation is shown
	let showRemoveConfirm = $state(false);

	// Use the item prop directly
	let currentItem = $state(item);

	// Update currentItem when the item prop changes
	$effect(() => {
		currentItem = item;
	});

	// Log initial item state
	console.log('[CART-ITEM] Initial item:', item);
	console.log('[CART-ITEM] Initial composites:', item.composites);

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(currentItem?.variant?.stock_quantity || 1);
	const quantity = $derived(currentItem?.quantity || 0);
	const price = $derived(currentItem?.price || 0);
	const variantName = $derived(currentItem?.variant?.name || 'Product');
	const variantImage = $derived(currentItem?.variant?.attributes?.image);



	let imageError = $state(false);
	let imageLoaded = $state(false);
	let isUpdating = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	// Function to show remove confirmation
	function showRemoveConfirmation() {
		if (disabled || isUpdating) return;
		showRemoveConfirm = true;
		// Auto-hide confirmation after 3 seconds if not clicked
		setTimeout(() => showRemoveConfirm = false, 3000);
	}

	// Cancel remove action (used in button click handler)
	function cancelRemove() {
		showRemoveConfirm = false;
	}

	// Helper function to safely update the cart store
	function safeUpdateCart(cartData: any) {
		if (cartData && typeof cartData === 'object' && 'items' in cartData && 'id' in cartData) {
			cart.set(cartData as any);
		} else {
			console.warn('[CART] Invalid cart data:', cartData);
		}
	}
</script>

<div class="relative">
	<div class="flex bg-background rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-transparent hover:border-border">
		<!-- Product Image with hover zoom -->
		<div class="w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-md border border-border/50 group">
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



					<!-- Composite Items -->
					{#if currentItem.composites && currentItem.composites.length > 0}
						<div class="mt-2 space-y-1">
							{#each currentItem.composites as composite}
								<div class="flex items-center gap-1">
									<div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
									<p class="text-sm text-muted-foreground">
										{composite.name}
									</p>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Stock Status -->
					{#if currentItem.variant.stockStatus === 'low_stock'}
						<p class="text-xs text-warning mt-1">Only {currentItem.variant.stock_quantity} left in stock</p>
					{:else if currentItem.variant.stockStatus === 'in_stock'}
						<p class="text-xs text-green-600 mt-1">In Stock</p>
					{/if}
				</div>

				<!-- Remove Button -->
				<div class="flex items-start justify-end gap-1">
					<div class="relative flex items-center gap-2">
						{#if showRemoveConfirm}
							<form
								method="POST"
								action="?/removeItem"
								use:enhance={() => {
									isUpdating = true;
									const itemName = currentItem.variant?.name || 'Item';
									const toastId = toast.loading(`Removing ${itemName}...`, { duration: 30000 });

									return async ({ result }) => {
										if (result.type === 'success') {
											// Update the cart store with the returned data
											if (result.data?.cart) {
												safeUpdateCart(result.data.cart);
											}
											toast.success(`${itemName} removed from cart`, { id: toastId, duration: 3000 });
										} else {
											toast.error(`Failed to remove ${itemName}`, { id: toastId });
										}
										isUpdating = false;
										showRemoveConfirm = false;
									};
								}}
							>
								<div class="flex items-center gap-2">
									<Button
										class="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
										variant="ghost"
										type="button"
										onclick={cancelRemove}
										disabled={disabled || isUpdating}
										aria-label="Cancel removal"
									>
										<span class="text-xs">Cancel</span>
									</Button>
									<Button
										class="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
										variant="ghost"
										type="submit"
										disabled={disabled || isUpdating}
										aria-label="Confirm removal"
									>
										<span class="text-xs font-medium">Confirm</span>
									</Button>
								</div>
								<input type="hidden" name="cartItemId" value={currentItem.id} />
							</form>
						{:else}
							<Button
								class="p-2 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 group"
								variant="ghost"
								onclick={showRemoveConfirmation}
								disabled={disabled || isUpdating}
								aria-label="Remove item"
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				</div>
			</div>

			<div class="mt-4 flex justify-between items-center">
				<!-- Improved Quantity Controls with Server Actions -->
				<div class="flex items-center space-x-2 bg-muted/10 rounded-md p-1.5 border border-border/50">
					<form
						method="POST"
						action="?/updateItem"
						use:enhance={() => {
							isUpdating = true;
							const itemName = currentItem.variant?.name || 'Item';
							const toastId = toast.loading(`Updating ${itemName}...`, { duration: 30000 });

							return async ({ result }) => {
								if (result.type === 'success') {
									// Update the cart store with the returned data
									if (result.data?.cart) {
										console.log('[CART] Received updated cart data:', result.data.cart);
										safeUpdateCart(result.data.cart);
									} else {
										console.warn('[CART] No cart data received in result:', result);
									}
									toast.success(`${itemName} quantity updated`, { id: toastId, duration: 3000 });
								} else {
									console.error('[CART] Error updating item:', result);
									toast.error(`Failed to update ${itemName}`, { id: toastId });
								}
								isUpdating = false;
							};
						}}
					>
						<input type="hidden" name="cartItemId" value={currentItem.id} />
						<input type="hidden" name="quantity" value={Math.max(1, quantity - 1)} />
						<Button
							class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
							variant="ghost"
							type="submit"
							disabled={disabled || isUpdating || quantity <= minQuantity}
							aria-label={m.cart_decrease_quantity()}
						>
							<Minus class="h-4 w-4" />
						</Button>
					</form>

					<span class="w-8 text-center text-sm font-medium">{quantity}</span>

					<form
						method="POST"
						action="?/updateItem"
						use:enhance={() => {
							isUpdating = true;
							const itemName = currentItem.variant?.name || 'Item';
							const toastId = toast.loading(`Updating ${itemName}...`, { duration: 30000 });

							return async ({ result }) => {
								console.log('Cart update result:', result);
								if (result.type === 'success') {
									// Update the cart store with the returned data
									if (result.data?.cart) {
										console.log('Setting cart with data:', result.data.cart);
										safeUpdateCart(result.data.cart);
									} else {
										console.warn('No cart data in result:', result);
									}
									toast.success(`${itemName} quantity updated`, { id: toastId, duration: 3000 });
								} else {
									console.error('Failed to update cart:', result);
									toast.error(`Failed to update ${itemName}`, { id: toastId });
								}
								isUpdating = false;
							};
						}}
					>
						<input type="hidden" name="cartItemId" value={currentItem.id} />
						<input type="hidden" name="quantity" value={quantity + 1} />
						<Button
							class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
							variant="ghost"
							type="submit"
							disabled={disabled || isUpdating || quantity >= maxQuantity}
							aria-label={m.cart_increase_quantity()}
						>
							<Plus class="h-4 w-4" />
						</Button>
					</form>
				</div>

				<!-- Price -->
				<div class="text-right">
					<span class="font-medium text-lg">{formatPrice(price * quantity)}</span>
				</div>
			</div>
		</div>
	</div>
</div>
