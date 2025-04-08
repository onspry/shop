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
	import { onMount } from 'svelte';
	// Import toast for notifications
	import { toast } from 'svelte-sonner';

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
			// Find the item name for the toast message
			const itemName = cartData?.items.find(item => item.id === itemId)?.variant?.name || 'Item';

			// Show loading toast
			const toastId = toast.loading(`Updating ${itemName}...`);

			const result = await updateCartItem(itemId, newQuantity);

			if (result.success) {
				// Update the toast to success
				toast.success(`${itemName} quantity updated`, {
					id: toastId,
					duration: 2000
				});
			} else {
				console.error('Failed to update quantity:', result.error);
				// Update the toast to error
				toast.error(`Couldn't update ${itemName}`, {
					id: toastId,
					description: result.error || 'Please try again',
					duration: 3000
				});
			}
		} catch (error) {
			console.error('Error updating quantity:', error);
			// Show error toast
			toast.error('Error updating cart', {
				description: 'Please try again later',
				duration: 3000
			});
		}
	}

	// Handle removing item from cart
	async function handleRemoveItem(itemId: string) {
		try {
			// Find the item name for the toast message
			const itemName = cartData?.items.find(item => item.id === itemId)?.variant?.name || 'Item';

			// Show loading toast
			const toastId = toast.loading(`Removing ${itemName}...`);

			const result = await removeCartItem(itemId);

			if (result.success) {
				// Update the toast to success
				toast.success(`${itemName} removed from cart`, {
					id: toastId,
					duration: 2000
				});
			} else {
				console.error('Failed to remove item:', result.error);
				// Update the toast to error
				toast.error(`Couldn't remove ${itemName}`, {
					id: toastId,
					description: result.error || 'Please try again',
					duration: 3000
				});
			}
		} catch (error) {
			console.error('Error removing item:', error);
			// Show error toast
			toast.error('Error updating cart', {
				description: 'Please try again later',
				duration: 3000
			});
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

		// Show loading toast
		const toastId = toast.loading(`Applying discount code...`);

		const result = await applyDiscount(discountCode);
		isApplyingDiscount = false;

		if (result.success) {
			// Update toast to success
			toast.success(`Discount applied successfully`, {
				id: toastId,
				duration: 2000
			});
		} else {
			discountError = result.error || m.cart_discount_invalid();
			// Update toast to error
			toast.error(`Couldn't apply discount`, {
				id: toastId,
				description: result.error || m.cart_discount_invalid(),
				duration: 3000
			});
		}
	}

	// Handle removing discount code
	async function handleRemoveDiscount() {
		isRemovingDiscount = true;

		// Show loading toast
		const toastId = toast.loading(`Removing discount...`);

		const result = await removeDiscount();
		isRemovingDiscount = false;

		if (result.success) {
			discountCode = '';
			// Update toast to success
			toast.success(`Discount removed`, {
				id: toastId,
				duration: 2000
			});
		} else {
			console.error('Failed to remove discount:', result.error);
			// Update toast to error
			toast.error(`Couldn't remove discount`, {
				id: toastId,
				description: result.error || 'Please try again',
				duration: 3000
			});
		}
	}

	// Handle checkout button click
	function handleCheckout() {
		goto('/checkout');
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-500" class:opacity-0={!contentVisible} class:opacity-100={contentVisible}>
	{#if !cartData || !cartData.items || cartData.items.length === 0}
		<!-- Empty Cart View - Full Width Layout -->
		<div class="flex flex-col items-center justify-center py-24 px-4">
			<div class="w-24 h-24 mb-6 relative">
				<ShoppingCart size={64} class="text-muted-foreground absolute" />
				<div class="w-full h-full rounded-full bg-muted/20 animate-pulse"></div>
			</div>
			<h1 class="text-3xl font-bold mb-3 text-center">{m.cart_empty_title()}</h1>
			<p class="text-muted-foreground mb-8 text-center max-w-md text-lg">
				{m.cart_empty_message()}
			</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<Button href="/products" size="lg" class="px-8">
					{m.cart_browse_products()}
					<ArrowRight class="ml-2 h-5 w-5" />
				</Button>
				<Button href="/" variant="outline" size="lg">
					Return to Home
				</Button>
			</div>
		</div>
	{:else}
		<!-- Populated Cart View - Two Column Layout -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<!-- Cart items list -->
			<div class="lg:col-span-7">
				<div class="flex items-center justify-between w-full mb-6">
					<h1 class="text-2xl font-semibold flex items-center gap-2">
						<ShoppingCart class="h-5 w-5" />
						{m.cart_title()}
					</h1>
				</div>

				<div class="space-y-6">
					{#each cartData.items as item (item.id)}
						<CartItem
							{item}
							onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
							onRemove={() => handleRemoveItem(item.id)}
							disabled={false}
						/>
					{/each}
				</div>
			</div>

		<!-- Cart summary -->
		<div class="lg:col-span-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
			{#if cartData && cartData.items && cartData.items.length > 0}
				<div class="bg-background rounded-lg">
					<div class="flex items-center justify-between w-full mb-6">
						<h2 class="text-2xl font-semibold flex items-center gap-2">
							<ShoppingCart class="h-5 w-5" />
							{m.cart_summary()}
						</h2>
					</div>

					<div class="space-y-6">
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
						<div class="space-y-4 border-t pt-6">
							{#if cartData.discountAmount > 0}
								<div class="flex justify-between text-green-600 dark:text-green-400">
									<span>{m.cart_discount()}</span>
									<span>-{formatPrice(cartData.discountAmount)}</span>
								</div>
							{/if}

							<div class="flex justify-between text-base">
								<span class="text-muted-foreground">{m.cart_shipping()}</span>
								<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
							</div>

							<div class="flex justify-between text-base">
								<span class="text-muted-foreground">{m.cart_tax()}</span>
								<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
							</div>

							<div class="flex justify-between text-xl font-semibold pt-4 mt-4 border-t">
								<span>{m.cart_total()}</span>
								<span>{formatPrice(cartData.total)}</span>
							</div>
						</div>

						<!-- Discount code form -->
						<div class="border-t pt-6">
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
										disabled={isApplyingDiscount}
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
								<p class="text-sm text-destructive mt-2">{discountError}</p>
							{/if}
						</div>

						<!-- Checkout button -->
						<div class="border-t pt-6">
							<Button class="w-full" size="lg" onclick={handleCheckout}>
								{m.cart_proceed_to_checkout()}
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
							<p class="text-center text-xs text-muted-foreground/60 mt-2">
								{m.cart_secure_transaction()}
							</p>
						</div>

						<!-- Terms Agreement -->
						<div class="text-xs text-muted-foreground/60 text-center space-y-1.5 border-t pt-6">
							<p>{m.cart_terms_agreement()}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
</div>
