<script lang="ts">
	// Use the data from the load function instead of page store
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatPrice } from '$lib/utils/price';
	import { formatDateTime, formatEstimatedDelivery, formatCreditCardNumber } from '$lib/utils/date';
	import { CheckCircle, Package, Truck, ShoppingBag, ArrowRight, CreditCard } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	// Get the order data from the server
	export let data: PageData;
	const { order } = data;

	// Calculate estimated delivery date (7 days from order date)
	const estimatedDelivery = formatEstimatedDelivery(order.createdAt, 7);

	// Determine payment method display
	const paymentMethod = {
		cardType: order.paymentMethod.includes('stripe') ? m.checkout_card_ending() : order.paymentMethod,
		// In a real implementation, we would extract the last 4 digits from the payment method
		lastFour: '1234' // Simulating last 4 digits for display
	};

</script>

<div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Order Confirmation Header -->
	<div class="text-center mb-12">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
			<CheckCircle class="h-8 w-8 text-primary" />
		</div>
		<h1 class="text-3xl font-bold mb-2">{m.order_confirmation_thank_you()}</h1>
		<p class="text-xl text-muted-foreground">
			{m.order_confirmation_number({ number: order.id })}
		</p>
		<p class="text-muted-foreground mt-2">
			{m.order_confirmation_email_sent()}
		</p>
	</div>

	<!-- Order Status Card -->
	<Card class="mb-8">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				{m.order_status()}
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<ShoppingBag class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">{m.order_placed()}</h3>
					<p class="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
				</div>

				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<Package class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">{m.order_processing()}</h3>
					<p class="text-sm text-muted-foreground">{m.order_processing_message()}</p>
				</div>

				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<Truck class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">{m.order_estimated_delivery()}</h3>
					<p class="text-sm text-muted-foreground">{estimatedDelivery}</p>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mt-8 mb-4">
				<div class="h-2 bg-muted rounded-full overflow-hidden">
					<div class="h-full bg-primary rounded-full" style="width: 33%"></div>
				</div>
				<div class="flex justify-between mt-2 text-xs text-muted-foreground">
					<span>{m.order_progress_placed()}</span>
					<span>{m.order_progress_processing()}</span>
					<span>{m.order_progress_shipped()}</span>
					<span>{m.order_progress_delivered()}</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Order Details -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Order Summary -->
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<ShoppingBag class="h-5 w-5" />
						{m.order_summary()}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-6">
						{#each order.items as item}
							<div class="flex justify-between items-start border-b pb-4">
								<div class="flex gap-4">
									<div class="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
										<ShoppingBag class="h-8 w-8 text-muted-foreground" />
									</div>
									<div>
										<h3 class="font-medium">{item.name}</h3>
										<p class="text-sm text-muted-foreground">{item.variantName}</p>
										<p class="text-sm">{m.checkout_quantity()} {item.quantity}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="font-medium">{formatPrice(item.totalPrice)}</p>
								</div>
							</div>
						{/each}

						<!-- Price Summary -->
						<div class="space-y-2 pt-4">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">{m.cart_subtotal()}</span>
								<span>{formatPrice(order.subtotal)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">{m.cart_shipping()}</span>
								<span>{formatPrice(order.shippingAmount)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">{m.cart_tax()}</span>
								<span>{formatPrice(order.taxAmount)}</span>
							</div>
							{#if order.discountAmount && order.discountAmount > 0}
								<div class="flex justify-between text-sm text-green-600 dark:text-green-400">
									<span>{m.cart_discount()}</span>
									<span>-{formatPrice(order.discountAmount)}</span>
								</div>
							{/if}
							<div class="flex justify-between font-medium text-lg pt-4 border-t mt-4">
								<span>{m.total()}</span>
								<span>{formatPrice(order.total)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Shipping & Payment Info -->
		<div class="space-y-6">
			<!-- Shipping Information -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Truck class="h-5 w-5" />
						{m.order_shipping_information()}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<p class="font-medium">
							{order.shippingAddress.firstName} {order.shippingAddress.lastName}
						</p>
						<p>{order.shippingAddress.address1}</p>
						{#if order.shippingAddress.address2}
							<p>{order.shippingAddress.address2}</p>
						{/if}
						<p>
							{order.shippingAddress.city}, {order.shippingAddress.state}
							{order.shippingAddress.postalCode}
						</p>
						<p>{order.shippingAddress.country}</p>
						{#if order.shippingAddress.phone}
							<p>{order.shippingAddress.phone}</p>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Payment Information -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<CreditCard class="h-5 w-5" />
						{m.order_payment_information()}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<p>
							{paymentMethod.cardType} {formatCreditCardNumber(paymentMethod.lastFour)}
						</p>
						<p class="text-sm text-muted-foreground">
							{m.order_billed_to_shipping()}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
		<Button variant="outline" href="/orders" class="flex items-center gap-2">
			{m.order_view_all()}
			<ArrowRight class="h-4 w-4" />
		</Button>
		<Button href="/products" class="flex items-center gap-2">
			{m.order_continue_shopping()}
			<ShoppingBag class="h-4 w-4" />
		</Button>
	</div>
</div>
