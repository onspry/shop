<script lang="ts">
	// Use the data from the load function instead of page store
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { formatPrice } from '$lib/utils/price';
	import { CheckCircle, Package, Truck, ShoppingBag, ArrowRight, CreditCard } from 'lucide-svelte';
	// Import messages if needed
	// import * as m from '$lib/paraglide/messages';

	// Get the order ID from the data
	export let data: PageData;
	const orderId = data.orderId;

	// In a real implementation, we would fetch the order details from the server
	// For now, we'll use mock data
	const mockOrder = {
		id: orderId,
		status: 'processing',
		createdAt: new Date().toISOString(),
		estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
		items: [
			{
				id: 'item1',
				name: 'Mechanical Keyboard',
				variant: 'Black / Cherry MX Red',
				price: 149.99,
				quantity: 1,
				imageUrl: '/images/placeholder.jpg'
			},
			{
				id: 'item2',
				name: 'Keycap Set',
				variant: 'PBT / Blue',
				price: 49.99,
				quantity: 1,
				imageUrl: '/images/placeholder.jpg'
			}
		],
		subtotal: 199.98,
		shipping: 5.99,
		tax: 16.00,
		total: 221.97,
		shippingAddress: {
			firstName: 'John',
			lastName: 'Doe',
			addressLine1: '123 Main St',
			addressLine2: 'Apt 4B',
			city: 'Anytown',
			state: 'CA',
			postalCode: '12345',
			country: 'US'
		},
		paymentMethod: {
			cardType: 'Visa',
			lastFour: '4242'
		}
	};

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Order Confirmation Header -->
	<div class="text-center mb-12">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
			<CheckCircle class="h-8 w-8 text-primary" />
		</div>
		<h1 class="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
		<p class="text-xl text-muted-foreground">
			Order #{mockOrder.id} has been successfully placed
		</p>
		<p class="text-muted-foreground mt-2">
			A confirmation email has been sent to your email address.
		</p>
	</div>

	<!-- Order Status Card -->
	<Card class="mb-8">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				Order Status
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<ShoppingBag class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">Order Placed</h3>
					<p class="text-sm text-muted-foreground">{formatDate(mockOrder.createdAt)}</p>
				</div>

				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<Package class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">Processing</h3>
					<p class="text-sm text-muted-foreground">Your order is being processed</p>
				</div>

				<div class="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
					<div class="bg-primary/10 p-3 rounded-full mb-3">
						<Truck class="h-6 w-6 text-primary" />
					</div>
					<h3 class="font-medium">Estimated Delivery</h3>
					<p class="text-sm text-muted-foreground">{mockOrder.estimatedDelivery}</p>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mt-8 mb-4">
				<div class="h-2 bg-muted rounded-full overflow-hidden">
					<div class="h-full bg-primary rounded-full" style="width: 33%"></div>
				</div>
				<div class="flex justify-between mt-2 text-xs text-muted-foreground">
					<span>Order Placed</span>
					<span>Processing</span>
					<span>Shipped</span>
					<span>Delivered</span>
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
						Order Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-6">
						{#each mockOrder.items as item}
							<div class="flex justify-between items-start border-b pb-4">
								<div class="flex gap-4">
									<div class="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
										<ShoppingBag class="h-8 w-8 text-muted-foreground" />
									</div>
									<div>
										<h3 class="font-medium">{item.name}</h3>
										<p class="text-sm text-muted-foreground">{item.variant}</p>
										<p class="text-sm">Qty: {item.quantity}</p>
									</div>
								</div>
								<div class="text-right">
									<p class="font-medium">{formatPrice(item.price * item.quantity)}</p>
								</div>
							</div>
						{/each}

						<!-- Price Summary -->
						<div class="space-y-2 pt-4">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Subtotal</span>
								<span>{formatPrice(mockOrder.subtotal)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Shipping</span>
								<span>{formatPrice(mockOrder.shipping)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Tax</span>
								<span>{formatPrice(mockOrder.tax)}</span>
							</div>
							<div class="flex justify-between font-medium text-lg pt-4 border-t mt-4">
								<span>Total</span>
								<span>{formatPrice(mockOrder.total)}</span>
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
						Shipping Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<p class="font-medium">
							{mockOrder.shippingAddress.firstName} {mockOrder.shippingAddress.lastName}
						</p>
						<p>{mockOrder.shippingAddress.addressLine1}</p>
						{#if mockOrder.shippingAddress.addressLine2}
							<p>{mockOrder.shippingAddress.addressLine2}</p>
						{/if}
						<p>
							{mockOrder.shippingAddress.city}, {mockOrder.shippingAddress.state}
							{mockOrder.shippingAddress.postalCode}
						</p>
						<p>{mockOrder.shippingAddress.country}</p>
					</div>
				</CardContent>
			</Card>

			<!-- Payment Information -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<CreditCard class="h-5 w-5" />
						Payment Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<p>
							{mockOrder.paymentMethod.cardType} ending in {mockOrder.paymentMethod.lastFour}
						</p>
						<p class="text-sm text-muted-foreground">
							Billed to the same address as shipping
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
		<Button variant="outline" href="/orders" class="flex items-center gap-2">
			View All Orders
			<ArrowRight class="h-4 w-4" />
		</Button>
		<Button href="/products" class="flex items-center gap-2">
			Continue Shopping
			<ShoppingBag class="h-4 w-4" />
		</Button>
	</div>
</div>
