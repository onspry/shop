<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/auth';
	import { ShoppingBag, Package, Clock } from 'lucide-svelte';

	let { data } = $props<{ data: { orders: any[] } }>();
	const user = $derived($userStore);

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);

		return () => clearTimeout(timer);
	});

	// Get status icon based on order status
	const statusIcons: Record<string, typeof Clock | typeof Package | typeof ShoppingBag> = {
		pending: Clock,
		processing: Package,
		shipped: Package,
		delivered: Package
	};

	function getStatusIcon(status: string) {
		return statusIcons[status.toLowerCase()] || ShoppingBag;
	}

	// Get status color based on order status
	function getStatusColor(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'text-yellow-500';
			case 'processing':
				return 'text-blue-500';
			case 'shipped':
				return 'text-purple-500';
			case 'delivered':
				return 'text-green-500';
			default:
				return 'text-gray-500';
		}
	}
</script>

<div class="min-h-screen bg-background">
	<div
		class="container mx-auto px-4 py-8 transition-opacity duration-500"
		class:opacity-0={!contentVisible}
		class:opacity-100={contentVisible}
	>
		<h1 class="text-3xl font-bold mb-8">{m.orders_title()}</h1>

		{#if !user}
			<div class="flex flex-col items-center justify-center py-12 px-4 border rounded-lg">
				<ShoppingBag size={64} class="text-muted-foreground mb-4" />
				<h2 class="text-xl font-medium mb-2">{m.orders_login_required()}</h2>
				<p class="text-muted-foreground mb-6 text-center">
					{m.orders_login_message()}
				</p>
				<Button href="/auth/login?redirect=/orders">
					{m.sign_in()}
				</Button>
			</div>
		{:else if !data.orders || data.orders.length === 0}
			<div class="flex flex-col items-center justify-center py-12 px-4 border rounded-lg">
				<ShoppingBag size={64} class="text-muted-foreground mb-4" />
				<h2 class="text-xl font-medium mb-2">{m.orders_empty_title()}</h2>
				<p class="text-muted-foreground mb-6 text-center">
					{m.orders_empty_message()}
				</p>
				<Button href="/products">
					{m.orders_browse_products()}
				</Button>
			</div>
		{:else}
			<div class="space-y-6">
				{#each data.orders as order}
					<Card>
						<CardHeader>
							<div class="flex justify-between items-start">
								<div>
									<CardTitle class="text-lg">
										{m.orders_order_number({ number: order.id })}
									</CardTitle>
									<p class="text-sm text-muted-foreground">
										{m.orders_placed_on({ date: new Date(order.createdAt).toLocaleDateString() })}
									</p>
								</div>
								<div class="flex items-center gap-2">
									{#if order.status.toLowerCase() === 'pending'}
										<Clock size={20} class={getStatusColor(order.status)} />
									{:else if ['processing', 'shipped', 'delivered'].includes(order.status.toLowerCase())}
										<Package size={20} class={getStatusColor(order.status)} />
									{:else}
										<ShoppingBag size={20} class={getStatusColor(order.status)} />
									{/if}
									<span class="font-medium capitalize">{order.status}</span>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div class="space-y-4">
								<!-- Order Items -->
								<div class="space-y-2">
									{#each order.items as item}
										<div class="flex justify-between items-start py-2 border-b last:border-0">
											<div class="flex-1">
												<div class="flex gap-3">
													<div
														class="bg-muted rounded-md w-12 h-12 flex items-center justify-center overflow-hidden relative"
													>
														{#if item.imageUrl}
															<img
																src={item.imageUrl}
																alt={item.name}
																class="w-full h-full object-cover"
															/>
														{:else}
															<ShoppingBag size={20} class="text-muted-foreground" />
														{/if}
													</div>
													<div class="flex-1">
														<p class="font-medium">{item.name}</p>
														{#if item.composites && item.composites.length > 0}
															<div class="mt-1">
																{#each item.composites as composite}
																	<p class="text-xs text-muted-foreground">
																		{composite.name} × {composite.quantity}
																	</p>
																{/each}
															</div>
														{/if}
														<div class="flex justify-between items-center w-full mt-1">
															<p class="text-sm text-muted-foreground">
																{m.orders_quantity({ quantity: item.quantity })}
															</p>
															<p class="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
														</div>
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>

								<!-- Order Summary -->
								<div class="space-y-1 pt-4">
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{m.cart_subtotal()}</span>
										<span>{formatPrice(order.subtotal)}</span>
									</div>

									{#if order.discountAmount > 0}
										<div class="flex justify-between text-sm text-green-600 dark:text-green-400">
											<span>{m.cart_discount()}</span>
											<span>-{formatPrice(order.discountAmount)}</span>
										</div>
									{/if}

									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{m.cart_shipping()}</span>
										<span>{formatPrice(order.shippingAmount)}</span>
									</div>

									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{m.cart_tax()}</span>
										<span>{formatPrice(order.taxAmount)}</span>
									</div>

									<div class="flex justify-between font-bold text-base pt-3 mt-3 border-t">
										<span>{m.cart_total()}</span>
										<span>{formatPrice(order.totalAmount)}</span>
									</div>
								</div>

								<!-- Shipping Address -->
								<div class="pt-4 border-t">
									<h3 class="font-medium mb-2">{m.orders_shipping_address()}</h3>
									<div class="text-sm text-muted-foreground">
										<p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
										<p>
											{order.shippingAddress.addressLine1}
											{#if order.shippingAddress.addressLine2}, {order.shippingAddress
													.addressLine2}{/if}
										</p>
										<p>
											{order.shippingAddress.city}, {order.shippingAddress.state}{' '}
											{order.shippingAddress.postalCode}
										</p>
										<p>{order.shippingAddress.country}</p>
										{#if order.shippingAddress.phone}
											<p class="mt-1">{order.shippingAddress.phone}</p>
										{/if}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
