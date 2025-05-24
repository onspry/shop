<script lang="ts">
	import type { CartItemViewModel } from '$lib/models/cart';
	import { Trash2, Minus, Plus } from 'lucide-svelte';
	import { AppImage } from '$lib/components/ui/app-image';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { cart } from '$lib/stores/cart';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { item, disabled = false } = $props<{
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

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(currentItem?.variant?.stock_quantity || 1);
	const quantity = $derived(currentItem?.quantity || 0);
	const price = $derived(currentItem?.price || 0);
	const variantName = $derived(currentItem?.variant?.name || 'Product');

	let isUpdating = $state(false);

	// Function to show remove confirmation
	function showRemoveConfirmation() {
		if (disabled || isUpdating) return;
		showRemoveConfirm = true;
		// Auto-hide confirmation after 3 seconds if not clicked
		setTimeout(() => (showRemoveConfirm = false), 3000);
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
	<div
		class="flex flex-col rounded-lg border border-transparent bg-background p-4 transition-all duration-200 hover:border-border hover:shadow-md sm:flex-row"
	>
		<!-- Mobile: Image and content stacked, Desktop: side by side -->
		<div class="flex gap-4 sm:w-full">
			<!-- Product Image -->
			<div
				class="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md sm:h-32 sm:w-32"
			>
				<AppImage
					src={currentItem.imageUrl}
					alt={variantName}
					width={128}
					height={128}
					className="h-full w-full group-hover:scale-110 transition-all duration-300"
					objectFit="cover"
				/>
			</div>

			<!-- Content section -->
			<div class="flex flex-1 flex-col justify-between">
				<!-- Top section: Product info and remove button -->
				<div class="flex justify-between">
					<div class="flex-1 pr-2">
						<h3 class="text-sm font-medium leading-tight sm:text-base">{variantName}</h3>

						<!-- Composite Items -->
						{#if currentItem.composites && currentItem.composites.length > 0}
							<div class="mt-1 space-y-0.5 sm:mt-2 sm:space-y-1">
								{#each currentItem.composites as composite}
									<div class="flex items-center gap-1">
										<div
											class="h-1 w-1 rounded-full bg-muted-foreground/40 sm:h-1.5 sm:w-1.5"
										></div>
										<p class="text-xs text-muted-foreground sm:text-sm">
											{composite.name}
										</p>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Stock Status -->
						{#if currentItem.variant.stockStatus === 'low_stock'}
							<p class="text-warning mt-1 text-xs">
								{m.stock_only_left({ count: currentItem.variant.stock_quantity })}
							</p>
						{:else if currentItem.variant.stockStatus === 'in_stock'}
							<p class="mt-1 text-xs text-green-600">{m.stock_in_stock()}</p>
						{/if}
					</div>

					<!-- Remove Button -->
					<div class="flex items-start justify-end">
						<div class="relative flex items-center">
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
												if (result.data?.cart) {
													safeUpdateCart(result.data.cart);
												}
												toast.success(`${itemName} removed from cart`, {
													id: toastId,
													duration: 3000
												});
											} else {
												toast.error(`Failed to remove ${itemName}`, { id: toastId });
											}
											isUpdating = false;
											showRemoveConfirm = false;
										};
									}}
								>
									<div class="flex items-center gap-1">
										<Button
											class="h-8 px-2 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
											variant="ghost"
											type="button"
											onclick={cancelRemove}
											disabled={disabled || isUpdating}
											aria-label="Cancel removal"
										>
											{m.action_cancel()}
										</Button>
										<Button
											class="h-8 px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
											variant="ghost"
											type="submit"
											disabled={disabled || isUpdating}
											aria-label="Confirm removal"
										>
											{m.action_confirm()}
										</Button>
									</div>
									<input type="hidden" name="cartItemId" value={currentItem.id} />
								</form>
							{:else}
								<Button
									class="h-8 w-8 rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
									variant="ghost"
									onclick={showRemoveConfirmation}
									disabled={disabled || isUpdating}
									aria-label="Remove item"
								>
									<Trash2 class="h-3 w-3 sm:h-4 sm:w-4" />
								</Button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom section: Quantity and Price (full width on mobile) -->
		<div
			class="mt-3 flex items-center justify-between sm:mt-0 sm:w-auto sm:flex-col sm:items-end sm:justify-between sm:pl-4"
		>
			<!-- Quantity Controls -->
			<div
				class="flex items-center space-x-1 rounded-md border border-border/50 bg-muted/10 p-1 dark:border-border dark:bg-muted/5 sm:space-x-2 sm:p-1.5"
			>
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
					<input type="hidden" name="quantity" value={Math.max(1, quantity - 1)} />
					<Button
						class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
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
						class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
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
				<span class="text-lg font-medium">{formatPrice(price * quantity, getLocale())}</span>
			</div>
		</div>
	</div>
</div>
