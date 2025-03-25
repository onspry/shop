<script lang="ts">
	import {
		updateCartFromPageData,
		resetCartStore,
		updateCartItem,
		removeCartItem,
		applyDiscount,
		removeDiscount
	} from '$lib/stores/cart';
	import type { CartViewModel } from '$lib/models/cart.js';
	import CartItem from '$lib/components/cart-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

	// Use data from the server
	let { data } = $props();

	// Track loading states for specific actions
	let loadingItemId = $state<string | null>(null);
	let loadingAction = $state<'increment' | 'decrement' | 'remove' | ''>('');
	let isApplyingDiscount = $state(false);
	let isRemovingDiscount = $state(false);
	let discountCode = $state('');
	let discountError = $state('');

	// Local cart data from the server
	let cartData = $state<CartViewModel | null>(null);

	// Update cart data when server data changes
	$effect(() => {
		if (data?.cart) {
			cartData = data.cart;
			// Update the global cart store
			updateCartFromPageData({ cart: data.cart });
		} else {
			cartData = null;
			resetCartStore();
		}

		if (data?.error) {
			console.error('Cart error:', data.error);
		}
	});

	// Handle updating cart item quantity
	async function handleQuantityChange(itemId: string, newQuantity: number) {
		loadingItemId = itemId;
		loadingAction =
			newQuantity > (cartData?.items.find((i) => i.id === itemId)?.quantity || 0)
				? 'increment'
				: 'decrement';
		const result = await updateCartItem(itemId, newQuantity);
		loadingItemId = null;
		loadingAction = '';

		if (!result.success) {
			console.error('Failed to update quantity:', result.error);
		}
	}

	// Handle removing item from cart
	async function handleRemoveItem(itemId: string) {
		loadingItemId = itemId;
		loadingAction = 'remove';
		const result = await removeCartItem(itemId);
		loadingItemId = null;
		loadingAction = '';

		if (!result.success) {
			console.error('Failed to remove item:', result.error);
		}
	}

	// Handle applying discount code
	async function handleApplyDiscount() {
		if (!discountCode) {
			discountError = m.cart_discount_code_required();
			return;
		}

		discountError = '';
		isApplyingDiscount = true;
		const result = await applyDiscount(discountCode);
		isApplyingDiscount = false;

		if (!result.success) {
			discountError = result.error || m.cart_discount_invalid();
		}
	}

	// Handle removing discount code
	async function handleRemoveDiscount() {
		isRemovingDiscount = true;
		const result = await removeDiscount();
		isRemovingDiscount = false;

		if (!result.success) {
			console.error('Failed to remove discount:', result.error);
		} else {
			discountCode = '';
		}
	}

	// Handle checkout button click
	function handleCheckout() {
		goto('/checkout');
	}
</script>

<div class="min-h-[80vh]">
	<h1 class="text-3xl font-bold mb-8">{m.cart_title()}</h1>

	{#if !cartData || !cartData.items || cartData.items.length === 0}
		<div class="flex flex-col items-center justify-center py-12 px-4 border rounded-lg">
			<ShoppingCart size={64} class="text-muted-foreground mb-4" />
			<h2 class="text-xl font-medium mb-2">{m.cart_empty_title()}</h2>
			<p class="text-muted-foreground mb-6 text-center">
				{m.cart_empty_message()}
			</p>
			<Button href="/products">
				{m.cart_browse_products()}
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Cart items list -->
			<div class="md:col-span-2 space-y-4">
				{#each cartData.items as item (item.id)}
					<CartItem
						{item}
						onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
						onRemove={() => handleRemoveItem(item.id)}
						isLoading={loadingItemId !== null}
						disabled={loadingItemId !== null}
						loadingAction={loadingItemId === item.id ? loadingAction : ''}
					/>
				{/each}
			</div>

			<!-- Cart summary -->
			<div class="md:col-span-1">
				<div class="bg-muted/40 rounded-lg p-6 sticky top-24">
					<h2 class="text-xl font-semibold mb-4">{m.cart_summary()}</h2>

					<div class="space-y-3 mb-6">
						<div class="flex justify-between">
							<span class="text-muted-foreground">{m.cart_subtotal()}</span>
							<span>{formatPrice(cartData.subtotal)}</span>
						</div>

						{#if cartData.discountAmount > 0}
							<div class="flex justify-between text-green-600 dark:text-green-400">
								<span>{m.cart_discount()}</span>
								<span>-{formatPrice(cartData.discountAmount)}</span>
							</div>
						{/if}

						<div class="flex justify-between font-bold text-lg pt-2 border-t">
							<span>{m.cart_total()}</span>
							<span>{formatPrice(cartData.total)}</span>
						</div>
					</div>

					<p class="text-sm text-muted-foreground mb-6">
						{m.cart_checkout_info()}
					</p>

					<!-- Discount code form -->
					<div class="mb-6">
						<div class="flex gap-2 mb-2">
							<Input
								placeholder={m.cart_discount_placeholder()}
								bind:value={discountCode}
								disabled={cartData.discountCode !== null ||
									isApplyingDiscount ||
									isRemovingDiscount}
							/>
							{#if cartData.discountCode}
								<Button
									variant="outline"
									disabled={isRemovingDiscount}
									onclick={handleRemoveDiscount}
								>
									{#if isRemovingDiscount}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										{m.cart_discount_remove()}
									{/if}
								</Button>
							{:else}
								<Button
									variant="outline"
									disabled={isApplyingDiscount || !discountCode}
									onclick={handleApplyDiscount}
								>
									{#if isApplyingDiscount}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										{m.cart_discount_apply()}
									{/if}
								</Button>
							{/if}
						</div>

						{#if discountError}
							<p class="text-sm text-destructive">{discountError}</p>
						{:else if cartData.discountCode}
							<p class="text-sm text-green-600 dark:text-green-400">
								{m.cart_discount_applied({ code: cartData.discountCode })}
							</p>
						{/if}
					</div>

					<!-- Checkout button -->
					<Button
						class="w-full"
						size="lg"
						disabled={cartData.items.length === 0}
						onclick={handleCheckout}
					>
						{m.cart_checkout()}
						<ArrowRight class="ml-2" size={16} />
					</Button>

					<p class="text-xs text-center text-muted-foreground mt-4">
						{m.cart_checkout_terms()}
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
