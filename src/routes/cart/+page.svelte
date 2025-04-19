<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import CartItem from '$lib/components/cart-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ShoppingCart, ArrowRight } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	// No need for toast import as it's handled in the cart-item component

	// Get the cart data from the server
	let { data } = $props();

	// Update the client-side cart store with server data
	$effect(() => {
		if (data?.cart) {
			console.log('Updating cart store with server data:', data.cart);
			cart.set(data.cart);
		}
	});

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
	onMount(() => {
		// Remove artificial delay
		contentVisible = true;
	});

	// No need for client-side cart handling functions anymore
	// We're using server actions directly in the cart-item component

	// Loading state for checkout button
	let isCheckingOut = $state(false);

	// Handle checkout button click
	function handleCheckout() {
		isCheckingOut = true;
		// Simulate a small delay to show the loading state
		setTimeout(() => {
			goto('/checkout');
		}, 300);
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-500" class:opacity-0={!contentVisible} class:opacity-100={contentVisible}>
	{#if !data.cart || !data.cart.items || data.cart.items.length === 0}
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
					{#each data.cart.items as item (item.id)}
						<CartItem {item} disabled={false} />
					{/each}
				</div>
			</div>

			<!-- Cart summary -->
			<div class="lg:col-span-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
				{#if data.cart && data.cart.items && data.cart.items.length > 0}
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
										>{data.cart.items.length}
										{data.cart.items.length === 1 ? 'item' : 'items'} in cart</span
									>
									<span
										>{data.cart.items.reduce((sum: number, item: typeof data.cart.items[0]) => sum + item.quantity, 0)} units total</span
									>
								</div>

								{#if data.cart.items.some((item: typeof data.cart.items[0]) => item.variant.stockStatus === 'low_stock')}
									<p class="text-warning mt-2">Some items are low in stock</p>
								{/if}
							</div>

							<!-- Price Breakdown -->
							<div class="space-y-4 border-t pt-6">

							<div class="flex justify-between text-base">
								<span class="text-muted-foreground">{m.cart_tax()}</span>
								<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
							</div>

							<div class="flex justify-between text-xl font-semibold pt-4 mt-4 border-t">
								<span>{m.cart_total()}</span>
								<span>{formatPrice(data.cart.total)}</span>
							</div>
						</div>

						<!-- Discount code form -->


						<!-- Checkout button -->
						<div class="border-t pt-6">
							<Button class="w-full" size="lg" onclick={handleCheckout} disabled={isCheckingOut}>
								{#if isCheckingOut}
									<span class="h-5 w-5 block animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
									<span class="ml-2">{m.loading()}</span>
								{:else}
									{m.cart_proceed_to_checkout()}
									<ArrowRight class="ml-2 h-4 w-4" />
								{/if}
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
