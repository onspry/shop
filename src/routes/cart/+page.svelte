<script lang="ts">
	import { enhance } from '$app/forms';
	import { cart, isLoading, updateCartFromPageData } from '$lib/stores/cart';
	import type { CartViewModel } from '$lib/types/cart';
	import { cartActions } from '$lib/stores/cart';
	import CartItem from '$lib/components/cart/cart-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import { invalidateAll } from '$app/navigation';
	import {
		cart_empty,
		cart_continue_shopping,
		cart_subtotal,
		cart_discount,
		cart_total,
		cart_checkout,
		cart_apply_discount,
		cart_discount_placeholder
	} from '$lib/paraglide/messages';

	// Define the type directly since it's not exported
	interface CartPageData {
		cart: {
			id: string;
			discountCode: string | null;
		} | null;
		items: Array<{
			id: string;
			productVariantId: string;
			quantity: number;
			price: number;
			variant: {
				id: string;
				name: string;
				price: number;
				stock_quantity: number;
				attributes: Record<string, unknown>;
				productId: string;
				sku: string;
				stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
			};
			product: {
				id: string;
				name: string;
				slug: string;
				description: string | null;
			} | null;
		}>;
		subtotal: number;
		discountAmount: number;
		total: number;
		error?: string;
	}

	// Use data from the server
	let { data } = $props();

	// State for loading states
	let loadingDiscount = $state(false);
	let pageLoading = $state(false);

	// Combined loading state to disable all controls
	const isAnyLoading = $derived($isLoading || loadingDiscount || pageLoading);

	// Update cart store with page data and debugging info
	$effect(() => {
		try {
			// Only update if we have valid data
			if (data) {
				updateCartFromPageData(data as CartPageData);
			}
		} catch (err) {
			console.error('Error updating cart data:', err);
		}
	});

	// State for discount code input
	let discountCode = $state('');
	let discountError = $state('');

	async function handleApplyDiscount() {
		if (!discountCode.trim()) {
			discountError = 'Please enter a discount code';
			return;
		}

		loadingDiscount = true;
		try {
			const success = await cartActions.applyDiscount({ code: discountCode });
			if (!success) {
				discountError = 'Invalid discount code';
			} else {
				discountError = '';
				discountCode = '';
			}
		} finally {
			loadingDiscount = false;
		}
	}

	async function handleRemoveDiscount() {
		if (isAnyLoading) return;

		loadingDiscount = true;
		try {
			await cartActions.removeDiscount();
		} finally {
			loadingDiscount = false;
		}
	}

	// Safe access helper function
	function getCartItems() {
		return $cart.items || [];
	}

	// Function to get cart item count text
	function getCartItemCountText(count: number): string {
		return count === 1 ? `${count} item` : `${count} items`;
	}

	// Handle checkout button click with loading state
	async function handleCheckout() {
		pageLoading = true;
		try {
			// Redirect to checkout
			window.location.href = '/checkout';
		} finally {
			// This will only run if the redirect fails
			pageLoading = false;
		}
	}
</script>

<div class="container py-10">
	<h1 class="text-3xl font-bold mb-8">
		<ShoppingCart class="inline-block mr-2 h-8 w-8" />
		{getCartItemCountText($cart.itemCount || 0)}
		{#if $isLoading}
			<span class="ml-2 inline-block">
				<Loader2 class="h-5 w-5 inline-block animate-spin text-muted-foreground" />
			</span>
		{/if}
	</h1>

	{#if !getCartItems().length}
		<div class="text-center py-16 border rounded-lg bg-card">
			<h2 class="text-xl font-medium mb-4">{cart_empty()}</h2>
			<Button href="/products" variant="default" class="mt-4" disabled={isAnyLoading}>
				{cart_continue_shopping()}
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Cart items -->
			<div class="md:col-span-2 space-y-4">
				{#each getCartItems() as item (item.id)}
					<CartItem {item} onUpdate={() => {}} />
				{/each}
			</div>

			<!-- Order summary -->
			<div class="bg-card border rounded-lg p-6 h-fit">
				<h2 class="font-medium text-lg mb-4">Order Summary</h2>

				<div class="space-y-3 mb-6">
					<div class="flex justify-between">
						<span class="text-muted-foreground">{cart_subtotal()}</span>
						<span>{formatPrice($cart.subtotal || 0)}</span>
					</div>

					{#if $cart.discountAmount > 0}
						<div class="flex justify-between text-success">
							<span>{cart_discount()}</span>
							<span>-{formatPrice($cart.discountAmount)}</span>
						</div>

						<Button
							type="button"
							variant="link"
							class="px-0 h-auto text-sm text-destructive"
							onclick={handleRemoveDiscount}
							disabled={isAnyLoading}
						>
							{#if loadingDiscount}
								<span class="animate-pulse flex items-center">
									<Loader2 class="h-3 w-3 mr-1 animate-spin" />
									Removing...
								</span>
							{:else}
								Remove discount
							{/if}
						</Button>
					{:else}
						<div class="pt-2">
							<div class="flex gap-2">
								<Input
									type="text"
									bind:value={discountCode}
									placeholder={cart_discount_placeholder()}
									class="h-9"
									disabled={isAnyLoading}
								/>
								<Button
									type="button"
									variant="outline"
									class="h-9"
									disabled={isAnyLoading}
									onclick={handleApplyDiscount}
								>
									{#if loadingDiscount}
										<span class="animate-pulse flex items-center">
											<Loader2 class="h-3 w-3 mr-1 animate-spin" />
											Applying...
										</span>
									{:else}
										{cart_apply_discount()}
									{/if}
								</Button>
							</div>
							{#if discountError}
								<p class="text-destructive text-xs mt-1">{discountError}</p>
							{/if}
						</div>
					{/if}

					<div class="border-t pt-3 flex justify-between font-medium">
						<span>{cart_total()}</span>
						<span>{formatPrice($cart.total || 0)}</span>
					</div>
				</div>

				<Button type="button" class="w-full" onclick={handleCheckout} disabled={isAnyLoading}>
					{#if pageLoading}
						<span class="flex items-center">
							<Loader2 class="h-4 w-4 mr-2 animate-spin" />
							Processing...
						</span>
					{:else}
						{cart_checkout()}
						<ArrowRight class="ml-2 h-4 w-4" />
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</div>
