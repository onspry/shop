<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	// Import directly from the index file
	import * as TabsPrimitive from '$lib/components/ui/tabs/index';
	import { superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas/auth';
	import { shippingSchema } from '$lib/schemas/shipping';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import { ArrowRight, ShoppingBag, User, Truck } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import ShippingForm from '$lib/components/checkout/shipping-form.svelte';
	import PaymentForm from '$lib/components/checkout/payment-form.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { userStore } from '$lib/stores/auth';

	// Extract the components from TabsPrimitive
	const { Tabs, TabsContent, TabsList, TabsTrigger } = TabsPrimitive;

	const { data } = $props<{ data: PageData }>();
	const user = $derived($userStore);
	const isAuthenticated = $derived(!!user);

	// Initialize forms with proper types
	const {
		form: loginForm,
		errors: loginErrors,
		enhance: loginEnhance
	} = superForm<z.infer<typeof loginSchema>>(data.form, {
		validators: zod(loginSchema),
		validationMethod: 'auto'
	});

	const {
		form: shippingForm,
		errors: shippingErrors,
		enhance: shippingEnhance
	} = superForm<z.infer<typeof shippingSchema>>(data.shippingForm, {
		validators: zod(shippingSchema),
		validationMethod: 'auto'
	});

	let activeTab = $state('shipping');
	let guestEmail = $state('');
	let shippingValidated = $state(false);

	// Derived state for shipping form validation
	let isShippingValid = $derived(
		$shippingForm.firstName?.trim() &&
			$shippingForm.lastName?.trim() &&
			$shippingForm.addressLine1?.trim() &&
			$shippingForm.city?.trim() &&
			$shippingForm.state?.trim() &&
			$shippingForm.postalCode?.trim() &&
			$shippingForm.country?.trim() &&
			Object.keys($shippingErrors).length === 0
	);

	// State for guest checkout
	let guestSubmitting = $state(false);
	let guestError = $state('');

	// Shipping cost and estimated days from the shipping form component
	let shippingCost = $state(0);
	let estimatedDays = $state('');

	function handleShippingCostUpdate(cost: number, days: string) {
		shippingCost = cost;
		estimatedDays = days;
	}

	function handleContinueToPayment() {
		shippingValidated = true;
		activeTab = 'payment';
	}

	// Handle guest checkout
	async function handleGuestCheckout(event: SubmitEvent) {
		event.preventDefault();
		guestSubmitting = true;
		guestError = '';

		const formData = new FormData();
		formData.append('email', guestEmail);

		try {
			const response = await fetch('?/guestCheckout', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				guestError = result.message || m.checkout_error_guest();
			}
			// Successful submission will cause a redirect
		} catch (error) {
			guestError = m.checkout_error_guest();
		} finally {
			guestSubmitting = false;
		}
	}

	// Derived values for order summary
	let subtotalWithDiscount = $derived(data.cart.subtotal - (data.cart.discountAmount || 0));
	let orderTotal = $derived(
		shippingValidated ? data.cart.total + shippingCost : subtotalWithDiscount
	);
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">{m.checkout_title()}</h1>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main checkout flow -->
		<div class="lg:col-span-2">
			{#if !isAuthenticated}
				<div class="bg-muted/40 p-4 rounded-lg mb-6 flex justify-between items-center">
					<div class="flex items-center gap-2">
						<User size={18} />
						<span>{m.checkout_have_account()}</span>
					</div>
					<Button variant="outline" href="/auth/login?redirect=/checkout">
						{m.sign_in()}
					</Button>
				</div>

				<Card class="mb-6">
					<CardHeader>
						<CardTitle>{m.checkout_guest_title()}</CardTitle>
						<CardDescription>{m.checkout_guest_description()}</CardDescription>
					</CardHeader>
					<CardContent>
						<form onsubmit={handleGuestCheckout} class="space-y-4">
							<div class="grid gap-2">
								<Label for="guest-email">{m.checkout_guest_email()}</Label>
								<Input
									id="guest-email"
									name="email"
									type="email"
									bind:value={guestEmail}
									placeholder="name@example.com"
									required
									disabled={guestSubmitting}
								/>
								{#if guestError}
									<p class="text-sm text-destructive">{guestError}</p>
								{/if}
							</div>

							<Button type="submit" class="w-full" disabled={guestSubmitting || !guestEmail}>
								{#if guestSubmitting}
									<LoadingSpinner size={16} className="mr-2" />
								{/if}
								{m.checkout_continue_as_guest()}
							</Button>
						</form>
					</CardContent>
				</Card>
			{/if}

			<Tabs value={activeTab} onValueChange={(value) => (activeTab = value)} class="w-full">
				<TabsList class="grid w-full grid-cols-2">
					<TabsTrigger value="shipping">
						{m.checkout_tab_shipping()}
					</TabsTrigger>
					<TabsTrigger value="payment" disabled={!shippingValidated}>
						{m.checkout_tab_payment()}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="shipping" class="space-y-6">
					<ShippingForm
						form={$shippingForm}
						errors={$shippingErrors}
						{isAuthenticated}
						userEmail={user?.email || ''}
						{guestEmail}
						onContinue={handleContinueToPayment}
						onShippingCostUpdate={handleShippingCostUpdate}
					/>
				</TabsContent>
				<TabsContent value="payment">
					<Card>
						<CardHeader>
							<h2 class="text-2xl font-semibold">{m.checkout_tab_payment()}</h2>
						</CardHeader>
						<CardContent>
							<PaymentForm />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>

		<!-- Order summary -->
		<div class="lg:col-span-1">
			<Card>
				<CardHeader>
					<CardTitle>{m.checkout_order_summary()}</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<!-- Cart items summary -->
					<div class="space-y-3">
						{#each data.cart.items as item}
							<div class="flex justify-between items-center py-2 border-b">
								<div class="flex gap-3 items-center">
									<div
										class="bg-muted rounded-md w-12 h-12 flex items-center justify-center overflow-hidden"
									>
										{#if item.imageUrl}
											<img src={item.imageUrl} alt={item.name} class="w-full h-full object-cover" />
										{:else}
											<ShoppingBag size={20} class="text-muted-foreground" />
										{/if}
									</div>
									<div>
										<p class="font-medium">{item.name}</p>
										<p class="text-sm text-muted-foreground">
											{m.checkout_quantity()}
											{item.quantity}
										</p>
									</div>
								</div>
								<div class="font-medium">
									{formatPrice(item.price * item.quantity)}
								</div>
							</div>
						{/each}
					</div>

					<!-- Price breakdown -->
					<div class="space-y-1 pt-4">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">{m.cart_subtotal()}</span>
							<span>{formatPrice(data.cart.subtotal)}</span>
						</div>

						{#if data.cart.discountAmount > 0}
							<div class="flex justify-between text-sm text-green-600 dark:text-green-400">
								<span>{m.cart_discount()}</span>
								<span>-{formatPrice(data.cart.discountAmount)}</span>
							</div>
						{/if}

						<!-- Shipping cost -->
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">{m.cart_shipping()}</span>
							{#if !shippingValidated}
								<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
							{:else}
								<span>{formatPrice(shippingCost)}</span>
							{/if}
						</div>

						<!-- Total -->
						<div class="flex justify-between font-bold text-base pt-3 mt-3 border-t">
							<span>{m.cart_total()}</span>
							<span>{formatPrice(orderTotal)}</span>
						</div>
					</div>

					<!-- Estimated delivery -->
					{#if shippingValidated}
						<div class="flex flex-col pt-4 border-t">
							<div class="flex items-center gap-2">
								<div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
									<Truck size={14} className="text-primary" />
								</div>
								<span class="font-medium">{m.checkout_estimated_delivery()}</span>
								<span class="text-muted-foreground">•</span>
								<span class="text-muted-foreground">
									{estimatedDays}
									{m.shipping_business_days()}
								</span>
							</div>
							<div class="mt-2 text-xs text-muted-foreground space-y-0.5 ml-7">
								<p class="font-medium">{m.checkout_delivery_address()}</p>
								<p>{$shippingForm.firstName} {$shippingForm.lastName}</p>
								<p>
									{$shippingForm.addressLine1}{#if $shippingForm.addressLine2}, {$shippingForm.addressLine2}{/if}
								</p>
								<p>{$shippingForm.city}, {$shippingForm.state} {$shippingForm.postalCode}</p>
								<p>{$shippingForm.country}</p>
								{#if $shippingForm.phone}
									<p class="mt-1">{$shippingForm.phone}</p>
								{/if}
							</div>
						</div>
					{/if}
				</CardContent>
				<CardFooter class="text-xs text-muted-foreground text-center">
					{m.checkout_secure_transaction()}
				</CardFooter>
			</Card>
		</div>
	</div>
</div>
