<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import CartItem from '$lib/components/cart-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ShoppingCart, ArrowRight } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	// No need for toast import as it's handled in the cart-item component

	// Get the cart data from the server
	let { data } = $props();

	// Use the cart store directly
	$effect(() => {
		if (data?.cart) {
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
			goto(localizeHref('/checkout'));
		}, 300);
	}
</script>

<div
	class="mx-auto max-w-[1400px] px-4 py-8 transition-opacity duration-500 sm:px-6 lg:px-8"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	{#if !$cart || !$cart.items || $cart.items.length === 0}
		<!-- Empty Cart View - Full Width Layout -->
		<div class="flex flex-col items-center justify-center px-4 py-24">
			<div class="relative mb-6 h-24 w-24">
				<ShoppingCart size={64} class="absolute text-muted-foreground" />
				<div class="h-full w-full animate-pulse rounded-full bg-muted/20"></div>
			</div>
			<h2 class="mb-3 text-center">{m.cart_empty_title()}</h2>
			<p class="mb-8 max-w-md text-center text-lg text-muted-foreground">
				{m.cart_empty_message()}
			</p>
			<div class="flex flex-col gap-4 sm:flex-row">
				<Button href={localizeHref('/products')} size="lg" class="px-8">
					{m.cart_browse_products()}
					<ArrowRight class="ml-2 h-5 w-5" />
				</Button>
				<Button href={localizeHref('/')} variant="outline" size="lg">{m.return_to_home()}</Button>
			</div>
		</div>
	{:else}
		<!-- Populated Cart View - Two Column Layout -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Cart items list -->
			<div class="lg:col-span-2">
				<div class="mb-6 flex w-full items-center justify-between">
					<h3 class="flex items-center gap-2">
						<ShoppingCart class="h-5 w-5" />
						{m.cart_title()}
					</h3>
				</div>

				<div class="space-y-4 sm:space-y-6">
					{#each $cart.items as item (item.id)}
						<CartItem {item} disabled={false} />
					{/each}
				</div>
			</div>

			<!-- Cart summary -->
			<div class="lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:col-span-1 lg:h-fit">
				{#if $cart && $cart.items && $cart.items.length > 0}
					<div class="rounded-lg border bg-background p-4 sm:p-6">
						<div class="mb-4 flex w-full items-center justify-between sm:mb-6">
							<h3 class="flex items-center gap-2 text-lg font-semibold">
								<ShoppingCart class="h-5 w-5" />
								{m.cart_summary()}
							</h3>
						</div>

						<div class="space-y-6">
							<!-- Items Summary -->
							<div class="text-sm text-muted-foreground">
								<div class="mb-1 flex justify-between">
									<span
										>{$cart.items.length}
										{$cart.items.length === 1
											? m.cart_item_count_singular()
											: m.cart_item_count_plural()}</span
									>
									<span
										>{$cart.items.reduce(
											(sum: number, item: (typeof $cart.items)[0]) => sum + item.quantity,
											0
										)}
										{m.cart_units_total()}</span
									>
								</div>

								{#if $cart.items.some((item: (typeof $cart.items)[0]) => item.variant.stockStatus === 'low_stock')}
									<p class="text-warning mt-2">{m.cart_low_stock_warning()}</p>
								{/if}
							</div>

							<!-- Price Breakdown -->
							<div class="space-y-4 border-t pt-6">
								<div class="flex justify-between text-base">
									<span class="text-muted-foreground">{m.cart_tax()}</span>
									<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
								</div>

								<div class="mt-4 flex justify-between border-t pt-4 text-xl font-semibold">
									<span>{m.cart_total()}</span>
									<span>{formatPrice($cart.total)}</span>
								</div>
							</div>

							<!-- Discount code form -->

							<!-- Checkout button -->
							<div class="border-t pt-6">
								<Button class="w-full" size="lg" onclick={handleCheckout} disabled={isCheckingOut}>
									{#if isCheckingOut}
										<span
											class="block h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
										></span>
										<span class="ml-2">{m.loading()}</span>
									{:else}
										{m.cart_proceed_to_checkout()}
										<ArrowRight class="ml-2 h-4 w-4" />
									{/if}
								</Button>
								<p class="mt-2 text-center text-xs text-muted-foreground/60">
									{m.cart_secure_transaction()}
								</p>
							</div>

							<!-- Terms Agreement -->
							<div class="space-y-1.5 border-t pt-6 text-center text-xs text-muted-foreground/60">
								<p>{m.cart_terms_agreement()}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
