<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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
	import { ShoppingBag, User, Truck, ImageOff } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import ShippingForm from '$lib/components/shipping-form.svelte';
	import PaymentForm from '$lib/components/payment-form.svelte';
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
	let emailValidated = $state(false);
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

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

	// Handle guest email validation
	async function handleGuestEmailValidation(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.validity.valid && guestEmail) {
			try {
				const formData = new FormData();
				formData.append('email', guestEmail);

				const response = await fetch('?/guestCheckout', {
					method: 'POST',
					body: formData
				});

				const result = await response.json();

				if (response.ok) {
					emailValidated = true;
					guestError = '';
				} else {
					guestError = result.message || m.checkout_error_guest();
					emailValidated = false;
				}
			} catch (error) {
				guestError = m.checkout_error_guest();
				emailValidated = false;
			}
		} else {
			emailValidated = false;
		}
	}

	function handleImageError(itemId: string) {
		imageStates.set(itemId, { error: true, loaded: false });
		imageStates = imageStates;
	}

	function handleImageLoad(itemId: string) {
		imageStates.set(itemId, { error: false, loaded: true });
		imageStates = imageStates;
	}

	// Derived values for order summary
	let subtotalWithDiscount = $derived(data.cart.subtotal - (data.cart.discountAmount || 0));
	let orderTotal = $derived(
		shippingValidated ? data.cart.total + shippingCost : subtotalWithDiscount
	);
</script>

<div class="space-y-12">
	<div class="space-y-4">
		<h1 class="text-4xl font-bold">{m.checkout_title()}</h1>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
			<!-- Main checkout flow -->
			<div class="lg:col-span-2">
				{#if !isAuthenticated}
					<div class="flex flex-col gap-6 mb-8">
						<!-- Sign In Option -->
						<div
							class="bg-muted/40 p-6 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4"
						>
							<div class="flex items-center gap-2">
								<User size={20} />
								<span class="font-medium">{m.checkout_have_account()}</span>
							</div>
							<Button
								variant="outline"
								href="/auth/login?redirect=/checkout"
								class="w-full sm:w-auto"
							>
								{m.sign_in()}
							</Button>
						</div>

						<!-- Guest Checkout -->
						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-t border-muted-foreground/20"></div>
							</div>
							<div class="relative flex justify-center text-xs uppercase">
								<span class="bg-background px-2 text-muted-foreground">{m.checkout_or()}</span>
							</div>
						</div>

						<Card class="border-0 bg-muted/5">
							<CardHeader>
								<CardTitle>{m.checkout_guest_title()}</CardTitle>
								<CardDescription>
									{m.checkout_guest_description()}
									{m.checkout_email_description()}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div class="space-y-2">
									<label for="guest-email" class="text-sm font-medium">
										{m.checkout_email_label()}
									</label>
									<input
										type="email"
										id="guest-email"
										name="email"
										bind:value={guestEmail}
										oninput={handleGuestEmailValidation}
										class="w-full rounded-md border border-input bg-background px-3 py-2"
										placeholder="your-email@example.com"
										required
									/>
									{#if guestError}
										<p class="text-sm text-destructive">{guestError}</p>
									{/if}
									<p class="text-sm text-muted-foreground">
										{m.checkout_email_usage_hint()}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				{/if}

				<Tabs value={activeTab} onValueChange={(value) => (activeTab = value)} class="w-full">
					<TabsList class="grid w-full grid-cols-2">
						<TabsTrigger value="shipping" disabled={!isAuthenticated && !emailValidated}>
							{m.checkout_tab_shipping()}
						</TabsTrigger>
						<TabsTrigger value="payment" disabled={!shippingValidated}>
							{m.checkout_tab_payment()}
						</TabsTrigger>
					</TabsList>
					<TabsContent value="shipping" class="mt-6">
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
					<TabsContent value="payment" class="mt-6">
						<Card class="border-0 bg-muted/5">
							<CardHeader>
								<h2 class="text-2xl font-semibold">{m.checkout_tab_payment()}</h2>
							</CardHeader>
							<CardContent>
								<PaymentForm
									onPayment={(event) => {
										if (event.success) {
											// TODO: Handle successful payment
										} else {
											// TODO: Handle payment error
										}
									}}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<!-- Order summary -->
			<div class="lg:col-span-1">
				<div class="bg-background rounded-lg p-6 space-y-6">
					<div class="flex items-center gap-2">
						<ShoppingBag class="h-6 w-6" />
						<h2 class="text-2xl font-semibold">{m.checkout_order_summary()}</h2>
					</div>

					<div class="text-sm text-muted-foreground">
						<div class="flex justify-between mb-1">
							<span
								>{data.cart.items.length}
								{data.cart.items.length === 1 ? 'item' : 'items'} in cart</span
							>
							<span
								>{data.cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} units total</span
							>
						</div>
					</div>

					<!-- Cart items summary -->
					<div class="space-y-6">
						{#each data.cart.items as item}
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex gap-4">
										<div class="relative">
											<div
												class="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium shadow-sm z-10"
											>
												{item.quantity}
											</div>
											<div class="relative w-12 h-12 overflow-hidden rounded-md bg-muted/10">
												{#if imageStates.get(item.id)?.error}
													<div class="absolute inset-0 flex items-center justify-center bg-muted">
														<ImageOff class="h-4 w-4 text-muted-foreground" />
													</div>
												{:else}
													{#if !imageStates.get(item.id)?.loaded}
														<div class="absolute inset-0">
															<div class="h-full w-full animate-pulse bg-muted-foreground/20"></div>
														</div>
													{/if}
													<img
														src={item.imageUrl}
														alt={item.name}
														class="h-full w-full object-cover transition-opacity duration-300"
														class:opacity-0={!imageStates.get(item.id)?.loaded}
														class:opacity-100={imageStates.get(item.id)?.loaded}
														onerror={() => handleImageError(item.id)}
														onload={() => handleImageLoad(item.id)}
													/>
												{/if}
											</div>
										</div>
										<div class="flex-1">
											<div class="flex justify-between items-start">
												<p class="font-medium">{item.name}</p>
												<p class="font-medium ml-4">{formatPrice(item.price * item.quantity)}</p>
											</div>
											{#if item.composites && item.composites.length > 0}
												<div class="mt-1">
													{#each item.composites as composite}
														<p class="text-xs text-muted-foreground">
															{composite.name}
														</p>
													{/each}
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Price breakdown -->
					<div class="space-y-4 pt-4">
						<div class="flex justify-between text-muted-foreground">
							<span>{m.cart_shipping()}</span>
							{#if !shippingValidated}
								<span>{m.cart_calculated_at_next_step()}</span>
							{:else}
								<span>{formatPrice(shippingCost)}</span>
							{/if}
						</div>

						<div class="flex justify-between text-muted-foreground">
							<span>{m.cart_tax()}</span>
							<span>{m.cart_calculated_at_next_step()}</span>
						</div>

						{#if data.cart.discountAmount > 0}
							<div class="flex justify-between text-green-600 dark:text-green-400">
								<span>{m.cart_discount()}</span>
								<span>-{formatPrice(data.cart.discountAmount)}</span>
							</div>
						{/if}

						<!-- Total -->
						<div class="flex justify-between text-xl font-semibold pt-4 mt-4 border-t">
							<span>{m.cart_total()}</span>
							<span>{formatPrice(orderTotal)}</span>
						</div>
					</div>

					<!-- Estimated delivery -->
					{#if shippingValidated}
						<div class="pt-4">
							<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
								<Truck class="h-4 w-4" />
								<span>{m.checkout_estimated_delivery()}</span>
							</div>
							<p class="text-sm font-medium">
								{estimatedDays}
								{m.shipping_business_days()}
							</p>
							<div class="mt-2 text-xs text-muted-foreground space-y-0.5">
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

					<div class="text-xs text-muted-foreground/60 text-center space-y-1.5">
						<p>{m.cart_terms_agreement()}</p>
						<p>{m.checkout_secure_transaction()}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
