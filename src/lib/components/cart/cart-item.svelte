<script lang="ts">
	import type { CartItemViewModel } from '$lib/types/cart';
	import { cartActions } from '$lib/stores/cart';
	import { X, Minus, Plus, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import { invalidateAll } from '$app/navigation';

	let { item, onUpdate = () => {} } = $props<{
		item: CartItemViewModel;
		onUpdate?: () => Promise<void> | void;
	}>();

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(item?.variant?.stock_quantity || 1);
	const quantity = $derived(item?.quantity || 0);
	const price = $derived(item?.price || 0);
	const itemId = $derived(item?.id || '');
	const variantName = $derived(item?.variant?.name || 'Product');
	const variantImage = $derived(item?.variant?.attributes?.image);

	// For loading states
	let updating = $state(false);
	let removing = $state(false);
	let error = $state('');
	let incrementing = $state(false);
	let decrementing = $state(false);

	// Operation in progress indicator to disable all controls
	const isOperationInProgress = $derived(updating || removing || incrementing || decrementing);

	// Update quantity with debounce
	let updateTimeout: ReturnType<typeof setTimeout>;

	async function incrementQuantity() {
		if (isOperationInProgress || !itemId || quantity >= maxQuantity) return;

		incrementing = true;
		try {
			await updateQuantity(quantity + 1);
		} finally {
			incrementing = false;
		}
	}

	async function decrementQuantity() {
		if (isOperationInProgress || !itemId || quantity <= minQuantity) return;

		decrementing = true;
		try {
			await updateQuantity(quantity - 1);
		} finally {
			decrementing = false;
		}
	}

	async function updateQuantity(newQuantity: number) {
		if (updating || !itemId) return;

		// Clear any existing timeout
		clearTimeout(updateTimeout);

		// Set a new timeout to debounce rapid changes with a shorter delay
		updateTimeout = setTimeout(async () => {
			if (newQuantity < minQuantity || newQuantity > maxQuantity) return;

			updating = true;
			error = '';

			try {
				// Use the cartActions to update the item
				const success = await cartActions.updateCartItem({
					cartItemId: itemId,
					quantity: newQuantity
				});

				if (!success) {
					error = 'Failed to update cart item';
				} else {
					// Let the parent know about the update
					await onUpdate();
					// Don't call invalidateAll here since it's handled in the cart store
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Error updating cart item';
				console.error('Error updating cart item:', e);
			} finally {
				updating = false;
			}
		}, 200); // Reduced from 500ms to 200ms
	}

	async function removeItem() {
		if (isOperationInProgress || !itemId) return;

		removing = true;
		error = '';

		try {
			// Use the cartActions to remove the item
			const success = await cartActions.removeCartItem({
				cartItemId: itemId
			});

			if (!success) {
				error = 'Failed to remove cart item';
			} else {
				// Let the parent know about the update
				await onUpdate();
				// Don't call invalidateAll here since it's handled in the cart store
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error removing cart item';
			console.error('Error removing cart item:', e);
		} finally {
			removing = false;
		}
	}
</script>

<div class="flex items-center gap-4 py-4 border-b border-border">
	<!-- Product image -->
	<div class="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
		{#if variantImage}
			<img src={variantImage} alt={variantName} class="w-full h-full object-cover" />
		{:else}
			<div class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
				<span class="text-xs">No image</span>
			</div>
		{/if}
	</div>

	<!-- Product details -->
	<div class="flex-grow">
		<h3 class="font-medium text-foreground">{variantName}</h3>
		<p class="text-sm text-muted-foreground">{formatPrice(price)}</p>
		{#if error}
			<p class="text-xs text-destructive mt-1">{error}</p>
		{/if}
	</div>

	<!-- Quantity control -->
	<div class="flex items-center space-x-2">
		<button
			class="p-1 rounded-md bg-muted text-foreground disabled:opacity-50"
			onclick={decrementQuantity}
			disabled={quantity <= minQuantity || isOperationInProgress || !itemId}
			aria-label="Decrease quantity"
		>
			{#if decrementing}
				<Loader2 class="h-4 w-4 animate-spin" />
			{:else}
				<Minus class="h-4 w-4" />
			{/if}
		</button>

		<span class="w-8 text-center font-medium">
			{#if updating}
				<span class="animate-pulse">...</span>
			{:else}
				{quantity}
			{/if}
		</span>

		<button
			class="p-1 rounded-md bg-muted text-foreground disabled:opacity-50"
			onclick={incrementQuantity}
			disabled={quantity >= maxQuantity || isOperationInProgress || !itemId}
			aria-label="Increase quantity"
		>
			{#if incrementing}
				<Loader2 class="h-4 w-4 animate-spin" />
			{:else}
				<Plus class="h-4 w-4" />
			{/if}
		</button>
	</div>

	<!-- Item total -->
	<div class="w-24 text-right font-medium">
		{formatPrice(price * quantity)}
	</div>

	<!-- Remove button -->
	<button
		class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
		onclick={removeItem}
		disabled={isOperationInProgress || !itemId}
		aria-label={m.cart_remove()}
	>
		{#if removing}
			<Loader2 class="h-5 w-5 animate-spin" />
		{:else}
			<X class="h-5 w-5" />
		{/if}
	</button>
</div>
