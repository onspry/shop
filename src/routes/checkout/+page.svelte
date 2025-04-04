<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Root as Select,
		Trigger as SelectTrigger,
		Content as SelectContent,
		Group as SelectGroup,
		Item as SelectItem
	} from '$lib/components/ui/select';
	import * as Accordion from '$lib/components/ui/accordion';
	import { superForm } from 'sveltekit-superforms/client';
	import { enhance } from '$app/forms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { emailSchema, shippingSchema } from '$lib/schemas/checkout';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingBag, User, Truck, ImageOff, Mail, MapPin, CreditCard } from 'lucide-svelte';
	import type { z } from 'zod';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { countries, addressStructures } from '$lib/config/address-structures';
	import { checkoutStore } from '$lib/stores/checkout';
	import { onMount } from 'svelte';

	// Page data props
	const { data } = $props<{ data: PageData }>();

	// Image handling state
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

	// Only maintain accordion state locally - the single state we need
	let currentSection = $state($checkoutStore.currentSection);

	// Synchronize section change with store
	$effect(() => {
		checkoutStore.setCurrentSection(currentSection);
	});

	// Initialize forms with proper types
	const {
		form: emailForm,
		errors: emailErrors,
		enhance: emailEnhance
	} = superForm<z.infer<typeof emailSchema>>(data.emailForm, {
		validators: zod(emailSchema),
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

	// Read-only derived checkout state for UI rendering
	const checkout = $derived({
		// Validation states
		emailValidated: $checkoutStore.emailValidated,
		shippingValidated: $checkoutStore.shippingValidated,
		// User data
		email: $checkoutStore.email,
		// Shipping config
		country: $checkoutStore.shippingConfig.country,
		shippingMethod: $checkoutStore.shippingConfig.shippingMethod,
		// Shipping details for display
		shippingCost: $checkoutStore.shippingCost,
		estimatedDays: $checkoutStore.estimatedDays,
		// Computed values
		shippingAddress: $checkoutStore.shippingValidated ? { ...$checkoutStore.shippingConfig } : null,
		addressStructure:
			addressStructures[$checkoutStore.shippingConfig.country] || addressStructures.DEFAULT,
		// Order summary
		subtotalWithDiscount: data.cart.subtotal - (data.cart.discountAmount || 0),
		total: $checkoutStore.shippingValidated
			? data.cart.total + $checkoutStore.shippingCost
			: data.cart.subtotal - (data.cart.discountAmount || 0),
		// User info
		isLoggedIn: !!data.user
	});

	// Initialize forms from store data on mount
	onMount(() => {
		// Handle user data if logged in
		if (data.user) {
			// Set email from logged in user (automatically validates)
			checkoutStore.setEmail(data.user.email, true);
			currentSection = 'shipping';

			// Pre-populate shipping form with user profile data
			if (data.user.profile) {
				$shippingForm.firstName =
					data.user.profile.firstName || $checkoutStore.shippingConfig.firstName;
				$shippingForm.lastName =
					data.user.profile.lastName || $checkoutStore.shippingConfig.lastName;
			}
		} else if ($checkoutStore.email) {
			// For guest users, use the email if already in store
			$emailForm.email = $checkoutStore.email;
		}

		// Populate shipping form with stored data
		$shippingForm.firstName = $shippingForm.firstName || $checkoutStore.shippingConfig.firstName;
		$shippingForm.lastName = $shippingForm.lastName || $checkoutStore.shippingConfig.lastName;
		$shippingForm.addressLine1 = $checkoutStore.shippingConfig.addressLine1;
		$shippingForm.addressLine2 = $checkoutStore.shippingConfig.addressLine2;
		$shippingForm.city = $checkoutStore.shippingConfig.city;
		$shippingForm.state = $checkoutStore.shippingConfig.state;
		$shippingForm.postalCode = $checkoutStore.shippingConfig.postalCode;
		$shippingForm.country = $checkoutStore.shippingConfig.country;
		$shippingForm.shippingMethod = $checkoutStore.shippingConfig.shippingMethod;
	});

	// Shipping methods data
	const shippingMethods = [
		{
			id: 'standard',
			name: m.shipping_standard(),
			price: 5.99,
			description: m.shipping_standard_desc(),
			estimatedDays: '5-7'
		},
		{
			id: 'express',
			name: m.shipping_express(),
			price: 14.99,
			description: m.shipping_express_desc(),
			estimatedDays: '2-3'
		},
		{
			id: 'overnight',
			name: m.shipping_overnight(),
			price: 29.99,
			description: m.shipping_overnight_desc(),
			estimatedDays: '1'
		}
	];

	// Handle form action results
	$effect(() => {
		// Email form handling
		if (data.emailForm?.error) {
			// Email validation failed
			checkoutStore.setEmail($emailForm.email, false);
		} else if (data.emailForm?.success) {
			// Email validation successful
			checkoutStore.setEmail($emailForm.email, true);
			currentSection = 'shipping';
		}

		// Shipping form handling
		if (data.shippingForm?.error) {
			// Shipping validation failed
			checkoutStore.setShippingValidated(false);
		} else if (data.shippingForm?.success) {
			// Shipping validation successful

			// Update shipping config in store
			checkoutStore.updateShippingConfig({
				firstName: $shippingForm.firstName,
				lastName: $shippingForm.lastName,
				addressLine1: $shippingForm.addressLine1,
				addressLine2: $shippingForm.addressLine2,
				city: $shippingForm.city,
				state: $shippingForm.state,
				postalCode: $shippingForm.postalCode,
				country: $shippingForm.country,
				shippingMethod: $shippingForm.shippingMethod
			});

			// Find shipping cost based on selected method
			const method = shippingMethods.find((m) => m.id === $shippingForm.shippingMethod);
			if (method) {
				checkoutStore.setShippingCost(method.price);
				checkoutStore.setEstimatedDays(method.estimatedDays);
			}

			// Mark shipping as validated and proceed to payment
			checkoutStore.setShippingValidated(true);
			currentSection = 'payment';
		}
	});

	// Update shipping method in form and store
	function handleShippingMethodChange(method: string) {
		// Update the form value
		$shippingForm.shippingMethod = method;

		// Update shipping method details
		const selectedMethod = shippingMethods.find((sm) => sm.id === method);
		if (selectedMethod) {
			// Update shipping cost and estimated days in store
			checkoutStore.setShippingCost(selectedMethod.price);
			checkoutStore.setEstimatedDays(selectedMethod.estimatedDays);
		}
	}

	// Image handling functions
	function handleImageError(itemId: string) {
		imageStates.set(itemId, { error: true, loaded: false });
		imageStates = imageStates;
	}

	function handleImageLoad(itemId: string) {
		imageStates.set(itemId, { error: false, loaded: true });
		imageStates = imageStates;
	}

	// Handle section change requests
	function handleSectionChange(section: string) {
		// Prevent unauthorized section changes
		if (section === 'shipping' && !checkout.emailValidated) {
			return;
		}

		if (section === 'payment' && !checkout.shippingValidated) {
			return;
		}

		// Allow section change if validation passed
		currentSection = section as 'email' | 'shipping' | 'payment';
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Main checkout flow -->
		<div class="lg:col-span-8">
			<Accordion.Root type="single" value={currentSection} onValueChange={handleSectionChange}>
				<!-- Email Section -->
				<Accordion.Item value="email">
					<Accordion.Trigger class="w-full py-4">
						<div class="flex items-center justify-between w-full">
							<h2 class="text-2xl font-semibold flex items-center gap-2">
								<Mail class="h-5 w-5" />
								{m.checkout_tab_email()}
							</h2>
							{#if checkout.emailValidated && currentSection !== 'email'}
								<div class="text-sm text-muted-foreground flex items-center gap-2">
									<User class="h-4 w-4" />
									<span>{checkout.email}</span>
								</div>
							{/if}
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="pt-4">
						<div class="space-y-6">
							{#if checkout.isLoggedIn}
								<!-- Logged in user view -->
								<div class="flex items-start gap-4">
									<div class="bg-muted p-4 rounded-lg flex-1">
										<div class="flex items-center gap-2 mb-2">
											<User class="h-5 w-5 text-primary" />
											<p class="font-medium">Signed in as</p>
										</div>
										<p class="text-muted-foreground">{data.user.email}</p>
									</div>
								</div>
							{:else}
								<div class="flex items-center justify-between">
									<h3 class="text-lg font-medium">Contact information</h3>
									<div class="text-sm">
										Already have an account?
										<a href="/auth/login?redirect=/checkout" class="text-primary hover:underline"
											>Log in</a
										>
									</div>
								</div>

								<div class="space-y-4">
									<div class="space-y-2">
										<Input
											type="email"
											name="email"
											bind:value={$emailForm.email}
											placeholder="Email"
											required
											onblur={() => {
												if (!$emailForm.email || $emailForm.email.trim() === '') {
													// Don't validate empty emails, just update store with empty value
													checkoutStore.setEmail('', false);
													return;
												}

												const result = emailSchema.safeParse({ email: $emailForm.email });
												if (result.success) {
													checkoutStore.setEmail($emailForm.email, true);
													currentSection = 'shipping';
												} else {
													// Set email to empty in the store
													checkoutStore.setEmail($emailForm.email, false);
												}
											}}
										/>
										{#if $emailErrors.email}
											<p class="text-sm text-destructive">{$emailErrors.email}</p>
										{:else if !checkout.emailValidated && $emailForm.email && $emailForm.email.length > 0}
											<p class="text-sm text-destructive">Please enter a valid email address</p>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Shipping Section -->
				<Accordion.Item value="shipping" disabled={!checkout.emailValidated}>
					<Accordion.Trigger class="w-full py-4">
						<div class="flex items-center justify-between w-full">
							<h2 class="text-2xl font-semibold flex items-center gap-2">
								<MapPin class="h-5 w-5" />
								{m.checkout_tab_shipping()}
							</h2>
							{#if checkout.shippingValidated && currentSection !== 'shipping'}
								<div class="text-sm text-muted-foreground flex items-center gap-4">
									<div class="flex items-center gap-2">
										<MapPin class="h-4 w-4" />
										<span
											>{checkout.shippingAddress?.city}, {checkout.shippingAddress?.country}</span
										>
									</div>
									{#if checkout.shippingMethod}
										<div class="flex items-center gap-2">
											<Truck class="h-4 w-4" />
											<span>
												{shippingMethods.find((m) => m.id === checkout.shippingMethod)?.name}
												({formatPrice(checkout.shippingCost)})
											</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="pt-4">
						<div class="py-6">
							<form method="POST" action="?/shipping" use:shippingEnhance class="space-y-6">
								<!-- Country Selection -->
								<div class="grid gap-2">
									<Label for="country">{m.country()}</Label>
									{#if browser}
										<Select
											type="single"
											value={$shippingForm.country}
											onValueChange={(value) => ($shippingForm.country = value)}
										>
											<SelectTrigger class="w-full">
												{countries.find((c) => c.value === $shippingForm.country)?.label ||
													m.country_us()}
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{#each countries as country}
														<SelectItem value={country.value}>
															{country.label}
														</SelectItem>
													{/each}
												</SelectGroup>
											</SelectContent>
										</Select>
									{:else}
										<Input type="text" name="country" value={$shippingForm.country} readonly />
									{/if}
								</div>

								<!-- Form Fields -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="grid gap-2">
										<Label for="firstName">{m.checkout_first_name()}</Label>
										<Input
											type="text"
											name="firstName"
											bind:value={$shippingForm.firstName}
											required
										/>
									</div>

									<div class="grid gap-2">
										<Label for="lastName">{m.checkout_last_name()}</Label>
										<Input
											type="text"
											name="lastName"
											bind:value={$shippingForm.lastName}
											required
										/>
									</div>

									<div class="grid gap-2 md:col-span-2">
										<Label for="addressLine1">{checkout.addressStructure.labels.addressLine1}</Label
										>
										<Input
											type="text"
											name="addressLine1"
											bind:value={$shippingForm.addressLine1}
											placeholder={checkout.addressStructure.placeholders.addressLine1}
											required
										/>
									</div>

									<div class="grid gap-2 md:col-span-2">
										<Label for="addressLine2">{checkout.addressStructure.labels.addressLine2}</Label
										>
										<Input
											type="text"
											name="addressLine2"
											bind:value={$shippingForm.addressLine2}
											placeholder={checkout.addressStructure.placeholders.addressLine2}
										/>
									</div>

									<div class="grid gap-2">
										<Label for="city">{checkout.addressStructure.labels.city}</Label>
										<Input
											type="text"
											name="city"
											bind:value={$shippingForm.city}
											placeholder={checkout.addressStructure.placeholders.city}
											required
										/>
									</div>

									{#if checkout.addressStructure.fields.includes('state')}
										<div class="grid gap-2">
											<Label for="state">{checkout.addressStructure.labels.state}</Label>
											<Input
												type="text"
												name="state"
												bind:value={$shippingForm.state}
												placeholder={checkout.addressStructure.placeholders.state}
												required
											/>
										</div>
									{/if}

									<div class="grid gap-2">
										<Label for="postalCode">{checkout.addressStructure.labels.postalCode}</Label>
										<Input
											type="text"
											name="postalCode"
											bind:value={$shippingForm.postalCode}
											placeholder={checkout.addressStructure.placeholders.postalCode}
											required
										/>
									</div>
								</div>

								<!-- Shipping Method -->
								<div class="space-y-6">
									<h3 class="text-lg font-medium">{m.checkout_shipping_method()}</h3>
									<input
										type="hidden"
										name="shippingMethod"
										bind:value={$shippingForm.shippingMethod}
									/>
									<div
										class="space-y-4"
										role="radiogroup"
										aria-label={m.checkout_shipping_method()}
									>
										{#each shippingMethods as method}
											<button
												type="button"
												role="radio"
												aria-checked={$shippingForm.shippingMethod === method.id}
												class={`w-full text-left flex items-start gap-4 p-4 rounded-lg bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors ${$shippingForm.shippingMethod === method.id ? 'ring-1 ring-primary' : ''}`}
												onclick={() => handleShippingMethodChange(method.id)}
											>
												<div class="flex-1">
													<div class="flex items-center gap-2">
														<div
															class="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center"
														>
															{#if $shippingForm.shippingMethod === method.id}
																<div class="w-2 h-2 rounded-full bg-primary"></div>
															{/if}
														</div>
														<span class="font-medium">{method.name}</span>
														<span class="text-sm text-muted-foreground">
															({method.estimatedDays}
															{m.shipping_business_days()})
														</span>
													</div>
													<p class="text-sm text-muted-foreground ml-6 mt-1">
														{method.description}
													</p>
												</div>
												<div class="font-medium">{formatPrice(method.price)}</div>
											</button>
										{/each}
									</div>
								</div>

								<Button type="submit" class="w-full">
									{m.checkout_continue()}
								</Button>
							</form>
						</div>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Payment Section -->
				<Accordion.Item value="payment" disabled={!checkout.shippingValidated}>
					<Accordion.Trigger class="w-full py-4">
						<div class="flex items-center justify-between w-full">
							<h2 class="text-2xl font-semibold flex items-center gap-2">
								<CreditCard class="h-5 w-5" />
								{m.checkout_tab_payment()}
							</h2>
							{#if currentSection !== 'payment'}
								<div class="text-sm text-muted-foreground flex items-center gap-2">
									<CreditCard class="h-4 w-4" />
									<span>Not provided</span>
								</div>
							{/if}
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="pt-4">
						<div class="py-6">
							<div class="flex gap-4">
								<button
									class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
								>
									{m.simulate_successful_payment()}
								</button>
								<button
									class="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md"
								>
									{m.simulate_failed_payment()}
								</button>
							</div>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>

		<!-- Order summary -->
		<div class="lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
			<div class="bg-background rounded-lg p-6">
				<h2 class="text-2xl font-semibold flex items-center gap-2 pb-6">
					<ShoppingBag class="h-5 w-5" />
					{m.checkout_order_summary()}
				</h2>

				<div class="space-y-6">
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
														<p class="text-sm text-muted-foreground">
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
					<div class="space-y-4 border-t pt-6">
						<div class="flex justify-between text-base">
							<span class="text-muted-foreground">{m.cart_shipping()}</span>
							{#if !checkout.shippingValidated}
								<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
							{:else}
								<span>{formatPrice(checkout.shippingCost)}</span>
							{/if}
						</div>

						<div class="flex justify-between text-base">
							<span class="text-muted-foreground">{m.cart_tax()}</span>
							<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
						</div>

						{#if data.cart.discountAmount > 0}
							<div class="flex justify-between text-base text-green-600 dark:text-green-400">
								<span>{m.cart_discount()}</span>
								<span>-{formatPrice(data.cart.discountAmount)}</span>
							</div>
						{/if}

						<!-- Total -->
						<div class="flex justify-between text-xl font-semibold pt-4 mt-4 border-t">
							<span>{m.cart_total()}</span>
							<span>{formatPrice(checkout.total)}</span>
						</div>
					</div>

					<!-- Estimated delivery -->
					{#if checkout.shippingValidated && checkout.shippingAddress}
						<div class="border-t pt-6">
							<div class="flex items-center gap-2 text-base mb-2">
								<Truck class="h-5 w-5" />
								<span>{m.checkout_estimated_delivery()}</span>
							</div>
							<p class="text-base font-medium">
								{checkout.estimatedDays}
								{m.shipping_business_days()}
							</p>
							<div class="mt-4 text-sm text-muted-foreground space-y-1">
								<p class="font-medium">{m.checkout_delivery_address()}</p>
								<p>{checkout.shippingAddress.firstName} {checkout.shippingAddress.lastName}</p>
								<p>
									{checkout.shippingAddress
										.addressLine1}{#if checkout.shippingAddress.addressLine2}, {checkout
											.shippingAddress.addressLine2}{/if}
								</p>
								<p>
									{checkout.shippingAddress.city}, {checkout.shippingAddress.state}
									{checkout.shippingAddress.postalCode}
								</p>
								<p>{checkout.shippingAddress.country}</p>
							</div>
						</div>
					{/if}

					<div class="text-xs text-muted-foreground/60 text-center space-y-1.5 border-t pt-6">
						<p>{m.cart_terms_agreement()}</p>
						<p>{m.checkout_secure_transaction()}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if browser && import.meta.env.DEV}
	<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t">
		<details>
			<summary class="cursor-pointer font-medium mb-4">Debug Store State</summary>
			<div class="bg-muted p-4 rounded overflow-auto max-h-[500px]">
				<pre class="text-xs">{JSON.stringify($checkoutStore, null, 2)}</pre>
			</div>
		</details>
	</div>
{/if}
