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
	import { ShoppingCart, ArrowRight, Loader2, Truck } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';

	// Use data from the server
	let { data } = $props();

	// Track loading states for specific actions
	let isApplyingDiscount = $state(false);
	let isRemovingDiscount = $state(false);
	let discountCode = $state('');
	let discountError = $state('');

	// Content visibility control
	let contentVisible = $state(false);

	// Local cart data from the server
	let cartData = $state<CartViewModel | null>(null);

	// Set timeout to prevent flash of content
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);

		return () => clearTimeout(timer);
	});

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
		try {
			const result = await updateCartItem(itemId, newQuantity);
			if (!result.success) {
				console.error('Failed to update quantity:', result.error);
			}
		} catch (error) {
			console.error('Error updating quantity:', error);
		}
	}

	// Handle removing item from cart
	async function handleRemoveItem(itemId: string) {
		try {
			const result = await removeCartItem(itemId);
			if (!result.success) {
				console.error('Failed to remove item:', result.error);
			}
		} catch (error) {
			console.error('Error removing item:', error);
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

<div class="space-y-12">
	<div
		class="transition-opacity duration-500"
		class:opacity-0={!contentVisible}
		class:opacity-100={contentVisible}
	>
		<div class="space-y-4">
			<h1 class="text-4xl font-medium">{m.cart_title()}</h1>

			{#if !cartData || !cartData.items || cartData.items.length === 0}
				<div class="flex flex-col items-center justify-center py-16 bg-muted/5 rounded-lg">
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
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
					<!-- Cart items list -->
					<div class="lg:col-span-2 space-y-6">
						{#each cartData.items as item (item.id)}
							<CartItem
								{item}
								onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
								onRemove={() => handleRemoveItem(item.id)}
								disabled={false}
							/>
						{/each}
					</div>

					<!-- Cart summary -->
					<div class="lg:col-span-1">
						<div class="bg-background rounded-lg p-6 space-y-6">
							<div class="flex items-center gap-2">
								<ShoppingCart class="h-6 w-6" />
								<h2 class="text-2xl font-semibold">{m.cart_summary()}</h2>
							</div>

							<!-- Items Summary -->
							<div class="text-sm text-muted-foreground">
								<div class="flex justify-between mb-1">
									<span
										>{cartData.items.length}
										{cartData.items.length === 1 ? 'item' : 'items'} in cart</span
									>
									<span
										>{cartData.items.reduce((sum, item) => sum + item.quantity, 0)} units total</span
									>
								</div>

								{#if cartData.items.some((item) => item.variant.stockStatus === 'low_stock')}
									<p class="text-warning mt-2">Some items are low in stock</p>
								{/if}
							</div>

							<!-- Price Breakdown -->
							<div class="space-y-4 pt-4">
								{#if cartData.discountAmount > 0}
									<div class="flex justify-between text-green-600 dark:text-green-400">
										<span>{m.cart_discount()}</span>
										<span>-{formatPrice(cartData.discountAmount)}</span>
									</div>
								{/if}

								<div class="flex justify-between text-muted-foreground">
									<span>{m.cart_shipping()}</span>
									<span>{m.cart_calculated_at_next_step()}</span>
								</div>

								<div class="flex justify-between text-muted-foreground">
									<span>{m.cart_tax()}</span>
									<span>{m.cart_calculated_at_next_step()}</span>
								</div>

								<div class="flex justify-between text-xl font-semibold pt-4 mt-4 border-t">
									<span>{m.cart_total()}</span>
									<span>{formatPrice(cartData.total)}</span>
								</div>
							</div>

							<!-- Estimated Delivery -->
							<div class="pt-4">
								<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
									<Truck class="h-4 w-4" />
									<span>{m.cart_estimated_delivery()}</span>
								</div>
								<p class="text-sm font-medium">
									{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date(
										Date.now() + 10 * 24 * 60 * 60 * 1000
									).toLocaleDateString()}
								</p>
							</div>

							<!-- Discount code form -->
							<div class="pt-4">
								<div class="flex gap-2 mb-2">
									<Input
										placeholder={m.cart_discount_placeholder()}
										bind:value={discountCode}
										disabled={cartData.discountCode !== null ||
											isApplyingDiscount ||
											isRemovingDiscount}
										class="bg-muted/5"
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
								class="w-full bg-primary"
								size="lg"
								disabled={cartData.items.length === 0}
								href="/checkout"
							>
								{m.cart_proceed_to_checkout()}
								<ArrowRight class="ml-2" size={16} />
							</Button>

							<div class="text-xs text-muted-foreground/60 text-center space-y-1.5">
								<p>{m.cart_terms_agreement()}</p>
								<p>{m.cart_secure_transaction()}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
