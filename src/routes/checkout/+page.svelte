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
	import { shippingSchema } from '$lib/schemas/checkout';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import { ArrowRight, ShoppingBag, User } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { z } from 'zod';

	// Extract the components from TabsPrimitive
	const { Tabs, TabsContent, TabsList, TabsTrigger } = TabsPrimitive;

	const { data } = $props();

	// Initialize login form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(loginSchema),
		taintedMessage: null,
		validationMethod: 'auto'
	});

	let activeTab = $state('shipping');
	let guestEmail = $state('');

	type ShippingForm = z.infer<typeof shippingSchema>;
	const initialData: ShippingForm = {
		firstName: '',
		lastName: '',
		address: '',
		apartment: '',
		city: '',
		state: '',
		zip: '',
		phone: ''
	};

	const {
		form: shippingForm,
		errors: shippingErrors,
		enhance: shippingEnhance
	} = superForm(data.shippingForm, {
		validators: zod(shippingSchema),
		validationMethod: 'auto'
	});

	// Derived state for shipping form validation
	let isShippingValid = $derived(
		$shippingForm.firstName?.trim() &&
			$shippingForm.lastName?.trim() &&
			$shippingForm.address?.trim() &&
			$shippingForm.city?.trim() &&
			$shippingForm.state?.trim() &&
			$shippingForm.zip?.trim() &&
			$shippingForm.phone?.trim() &&
			Object.keys($shippingErrors).length === 0
	);

	// State for guest checkout
	let guestSubmitting = $state(false);
	let guestError = $state('');

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

	function handleContinueToPayment() {
		if (isShippingValid) {
			activeTab = 'payment';
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">{m.checkout_title()}</h1>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main checkout flow -->
		<div class="lg:col-span-2">
			{#if !data.isAuthenticated}
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
					<TabsTrigger value="payment" disabled={activeTab === 'shipping' && !isShippingValid}>
						{m.checkout_tab_payment()}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="shipping">
					<Card>
						<CardHeader>
							<h2 class="text-2xl font-semibold">{m.checkout_tab_shipping()}</h2>
						</CardHeader>
						<CardContent>
							<div class="space-y-6">
								<!-- Contact Information -->
								<div class="space-y-4">
									<h3 class="font-medium">{m.checkout_contact_info_title()}</h3>
									<div class="grid gap-4">
										<div class="grid gap-2">
											<Label for="email">Email</Label>
											<Input
												id="email"
												type="email"
												placeholder="name@example.com"
												value={data.isAuthenticated ? data.user?.email : guestEmail}
												disabled
											/>
										</div>
									</div>
								</div>

								<!-- Shipping Address -->
								<div class="space-y-4">
									<h3 class="font-medium">{m.checkout_tab_shipping()}</h3>
									<div class="grid gap-4">
										<div class="grid grid-cols-2 gap-4">
											<div class="grid gap-2">
												<Label for="firstName">{m.checkout_first_name()}</Label>
												<Input
													id="firstName"
													bind:value={$shippingForm.firstName}
													placeholder="John"
													required
													aria-invalid={$shippingErrors.firstName ? 'true' : undefined}
												/>
												{#if $shippingErrors.firstName}
													<p class="text-sm text-destructive">{$shippingErrors.firstName}</p>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="lastName">{m.checkout_last_name()}</Label>
												<Input
													id="lastName"
													bind:value={$shippingForm.lastName}
													placeholder="Doe"
													required
													aria-invalid={$shippingErrors.lastName ? 'true' : undefined}
												/>
												{#if $shippingErrors.lastName}
													<p class="text-sm text-destructive">{$shippingErrors.lastName}</p>
												{/if}
											</div>
										</div>
										<div class="grid gap-2">
											<Label for="address">{m.checkout_address()}</Label>
											<Input
												id="address"
												bind:value={$shippingForm.address}
												placeholder="123 Main St"
												required
												aria-invalid={$shippingErrors.address ? 'true' : undefined}
											/>
											{#if $shippingErrors.address}
												<p class="text-sm text-destructive">{$shippingErrors.address}</p>
											{/if}
										</div>
										<div class="grid gap-2">
											<Label for="apartment">{m.checkout_apartment()}</Label>
											<Input
												id="apartment"
												bind:value={$shippingForm.apartment}
												placeholder="Apt 4B"
											/>
										</div>
										<div class="grid grid-cols-3 gap-4">
											<div class="grid gap-2">
												<Label for="city">{m.checkout_city()}</Label>
												<Input
													id="city"
													bind:value={$shippingForm.city}
													placeholder="New York"
													required
													aria-invalid={$shippingErrors.city ? 'true' : undefined}
												/>
												{#if $shippingErrors.city}
													<p class="text-sm text-destructive">{$shippingErrors.city}</p>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="state">{m.checkout_state()}</Label>
												<Input
													id="state"
													bind:value={$shippingForm.state}
													placeholder="NY"
													required
													aria-invalid={$shippingErrors.state ? 'true' : undefined}
												/>
												{#if $shippingErrors.state}
													<p class="text-sm text-destructive">{$shippingErrors.state}</p>
												{/if}
											</div>
											<div class="grid gap-2">
												<Label for="zip">{m.checkout_zip()}</Label>
												<Input
													id="zip"
													bind:value={$shippingForm.zip}
													placeholder="10001"
													required
													aria-invalid={$shippingErrors.zip ? 'true' : undefined}
												/>
												{#if $shippingErrors.zip}
													<p class="text-sm text-destructive">{$shippingErrors.zip}</p>
												{/if}
											</div>
										</div>
										<div class="grid gap-2">
											<Label for="phone">{m.checkout_phone()}</Label>
											<Input
												id="phone"
												type="tel"
												bind:value={$shippingForm.phone}
												placeholder="(555) 555-5555"
												required
												aria-invalid={$shippingErrors.phone ? 'true' : undefined}
											/>
											{#if $shippingErrors.phone}
												<p class="text-sm text-destructive">{$shippingErrors.phone}</p>
											{/if}
										</div>
									</div>
								</div>

								<Button type="button" class="w-full" onclick={handleContinueToPayment}>
									{m.checkout_continue_to_payment()}
									<ArrowRight class="ml-2" size={16} />
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="payment">
					<Card>
						<CardHeader>
							<h2 class="text-2xl font-semibold">{m.checkout_tab_payment()}</h2>
						</CardHeader>
						<CardContent>
							<!-- Payment form will go here -->
							<div class="text-center py-12">
								<p>{m.checkout_payment_placeholder()}</p>
							</div>
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

					<!-- Order totals -->
					<div class="space-y-2 pt-4">
						<div class="flex justify-between">
							<span class="text-muted-foreground">{m.cart_subtotal()}</span>
							<span>{formatPrice(data.cart.subtotal)}</span>
						</div>

						{#if data.cart.discountAmount > 0}
							<div class="flex justify-between text-green-600 dark:text-green-400">
								<span>{m.cart_discount()}</span>
								<span>-{formatPrice(data.cart.discountAmount)}</span>
							</div>
						{/if}

						<div class="flex justify-between font-bold text-lg pt-2 border-t">
							<span>{m.cart_total()}</span>
							<span>{formatPrice(data.cart.total)}</span>
						</div>
					</div>

					{#if data.isAuthenticated && activeTab === 'shipping'}
						<Button href="/checkout/shipping" class="w-full mt-6">
							{m.checkout_continue()}
							<ArrowRight class="ml-2" size={16} />
						</Button>
					{:else if data.isAuthenticated && activeTab === 'payment'}
						<Button href="/checkout/payment" class="w-full mt-6">
							{m.checkout_continue()}
							<ArrowRight class="ml-2" size={16} />
						</Button>
					{/if}
				</CardContent>
				<CardFooter class="text-xs text-muted-foreground text-center">
					{m.checkout_secure_transaction()}
				</CardFooter>
			</Card>
		</div>
	</div>
</div>
