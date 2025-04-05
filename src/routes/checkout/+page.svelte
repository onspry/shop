<script lang="ts">
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
	import { superForm, type SuperForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { emailSchema } from '$lib/schemas/auth';
	import { shippingSchema, type ShippingSchema as ShippingZodSchema } from '$lib/schemas/shipping';
	import { paymentSchema, type PaymentSchema } from '$lib/schemas/payment';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingBag, User, Truck, ImageOff, Mail, MapPin, CreditCard } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { countries, addressStructures } from '$lib/config/address-structures';
	import { checkoutStore } from '$lib/stores/checkout';
	import { onMount } from 'svelte';

	// Page data props
	const { data } = $props<{ data: PageData }>();

	// Image handling state
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

	// Add local state for current section
	let currentSection = $state('email');

	// Initialize forms with proper types
	const {
		form: emailForm,
		errors: emailErrors,
		validate: validateEmail,
		constraints: emailConstraints,
		validateForm: validateEmailForm
	} = superForm(data.emailForm, {
		validators: zodClient(emailSchema),
		validationMethod: 'oninput'
	});

	const {
		form: shippingForm,
		errors: shippingErrors,
		validate: validateShipping,
		constraints: shippingConstraints,
		validateForm: validateShippingForm
	} = superForm(data.shippingForm, {
		validators: zodClient(shippingSchema),
		validationMethod: 'oninput'
	});

	const {
		form: paymentForm,
		errors: paymentErrors,
		validate: validatePayment,
		constraints: paymentConstraints,
		validateForm: validatePaymentForm
	} = superForm(data.paymentForm, {
		validators: zodClient(paymentSchema),
		validationMethod: 'oninput'
	});

	// Sync store state to forms immediately
	$effect(() => {
		// Sync email form with store
		if ($checkoutStore.email) {
			$emailForm.email = $checkoutStore.email;
		}

		// Sync shipping form with store
		if (Object.values($checkoutStore.shippingConfig).some((value) => value)) {
			$shippingForm.firstName = $checkoutStore.shippingConfig.firstName;
			$shippingForm.lastName = $checkoutStore.shippingConfig.lastName;
			$shippingForm.addressLine1 = $checkoutStore.shippingConfig.addressLine1;
			$shippingForm.addressLine2 = $checkoutStore.shippingConfig.addressLine2;
			$shippingForm.city = $checkoutStore.shippingConfig.city;
			$shippingForm.state = $checkoutStore.shippingConfig.state;
			$shippingForm.postalCode = $checkoutStore.shippingConfig.postalCode;
			$shippingForm.country = $checkoutStore.shippingConfig.country;
		}
	});

	// Read-only derived checkout state for UI rendering
	const checkout = $derived({
		// Validation states correctly checking for undefined error values
		emailValidated: $emailErrors.email === undefined,
		shippingValidated: Object.values($shippingErrors).every((error) => error === undefined),
		paymentValidated: Object.values($paymentErrors).every((error) => error === undefined),
		// User data
		email: $emailForm.email,
		// Shipping config
		country: $shippingForm.country,
		shippingMethod: $shippingForm.shippingMethod,
		// Shipping details for display
		shippingCost: $checkoutStore.shippingCost,
		estimatedDays: $checkoutStore.estimatedDays,
		// Payment details for display - don't use actual card number
		paymentMethod:
			$paymentForm.cardHolder && $paymentForm.cardNumber
				? `${$paymentForm.cardHolder} (••••${$paymentForm.cardNumber.slice(-4)})`
				: undefined,
		// Computed values
		shippingAddress: Object.values($shippingErrors).every((error) => error === undefined)
			? {
					firstName: $shippingForm.firstName,
					lastName: $shippingForm.lastName,
					addressLine1: $shippingForm.addressLine1,
					addressLine2: $shippingForm.addressLine2,
					city: $shippingForm.city,
					state: $shippingForm.state,
					postalCode: $shippingForm.postalCode,
					country: $shippingForm.country
				}
			: null,
		addressStructure: addressStructures[$shippingForm.country] || addressStructures.DEFAULT,
		// Order summary
		subtotalWithDiscount: data.cart.subtotal - (data.cart.discountAmount || 0),
		total: Object.values($shippingErrors).every((error) => error === undefined)
			? data.cart.total + $checkoutStore.shippingCost
			: data.cart.subtotal - (data.cart.discountAmount || 0),
		// User info
		isLoggedIn: !!data.user
	});

	// Initialize forms from store
	onMount(async () => {
		// Set email form from store or user data
		$emailForm.email = data.user?.email || $checkoutStore.email || '';

		// Set shipping form from store
		$shippingForm.firstName = $checkoutStore.shippingConfig.firstName || data.user?.firstName || '';
		$shippingForm.lastName = $checkoutStore.shippingConfig.lastName || data.user?.lastName || '';
		$shippingForm.addressLine1 =
			$checkoutStore.shippingConfig.addressLine1 || data.user?.address || '';
		$shippingForm.addressLine2 = $checkoutStore.shippingConfig.addressLine2 || '';
		$shippingForm.city = $checkoutStore.shippingConfig.city || data.user?.city || '';
		$shippingForm.state = $checkoutStore.shippingConfig.state || data.user?.state || '';
		$shippingForm.postalCode =
			$checkoutStore.shippingConfig.postalCode || data.user?.postalCode || '';
		$shippingForm.country = $checkoutStore.shippingConfig.country || data.user?.country || 'US';
		$shippingForm.shippingMethod = $checkoutStore.shippingConfig.shippingMethod || 'standard';

		// Payment form is initialized empty for security reasons
		// We don't retrieve payment data from any store

		// Explicitly validate both forms after setting values
		// This ensures proper initial validation state
		if ($emailForm.email) {
			await validateEmailForm();
		}

		// Start with email section for validation
		currentSection = 'email';
	});

	// Handle section changes
	async function handleSectionChange(section: string | undefined) {
		window.scrollTo(0, 0);

		// If no section is selected or same section clicked again,
		// we want to close the current section and show its summary
		if (!section || section === currentSection) {
			// When closing a section, we don't change the currentSection state
			// This allows us to keep track of the last selected section for
			// display purposes while still allowing the accordion to close
			return;
		}

		// Email section is always accessible
		if (section === 'email') {
			currentSection = section;
			return;
		}

		// For shipping section, validate email first
		if (section === 'shipping') {
			// Use validateForm for more reliable email validation
			const result = await validateEmailForm();
			if (result.valid) {
				// Update store with validated email
				checkoutStore.setEmail($emailForm.email);
				currentSection = section;
			}
			return;
		}

		// For payment section, validate both email and shipping
		if (section === 'payment') {
			// First validate email to ensure it's still valid
			const emailResult = await validateEmailForm();

			if (!emailResult.valid) {
				currentSection = 'email';
				return;
			}

			// Then validate shipping
			const shippingResult = await validateShippingForm();

			if (shippingResult.valid) {
				// Update store with validated data
				checkoutStore.setEmail($emailForm.email);
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

				const method = shippingMethods.find((sm) => sm.id === $shippingForm.shippingMethod);
				if (method) {
					checkoutStore.setShippingCost(method.price);
					checkoutStore.setEstimatedDays(method.estimatedDays);
				}

				currentSection = section;
			} else {
				currentSection = 'shipping';
			}
		}
	}

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

	// Update shipping method in form and store
	function handleShippingMethodChange(method: string) {
		// Update shipping method in form
		$shippingForm.shippingMethod = method;

		// Update shipping method details in store
		const selectedMethod = shippingMethods.find((sm) => sm.id === method);
		if (selectedMethod) {
			checkoutStore.updateShippingConfig({ shippingMethod: method });
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

	// Handle field blur
	async function handleFieldBlur(field: string, form: 'email' | 'shipping' | 'payment') {
		if (form === 'email') {
			const isValid = await validateEmail(field);
			// Always save the email to store regardless of validation result
			// This ensures we always have the latest email value
			checkoutStore.setEmail($emailForm.email);
		} else if (form === 'shipping') {
			const isValid = await validateShipping(field);

			// Always update the store with latest values regardless of validation
			checkoutStore.updateShippingConfig({
				firstName: $shippingForm.firstName,
				lastName: $shippingForm.lastName,
				addressLine1: $shippingForm.addressLine1,
				addressLine2: $shippingForm.addressLine2,
				city: $shippingForm.city,
				state: $shippingForm.state,
				postalCode: $shippingForm.postalCode,
				country: $shippingForm.country
			});
		} else if (form === 'payment') {
			const isValid = await validatePayment(field);

			// Do not store payment data for security reasons
			// Only validate the form
		}
	}

	// Update store on form success
	$effect(() => {
		if (data.emailForm?.success) {
			checkoutStore.setEmail($emailForm.email);
		}

		if (data.shippingForm?.success) {
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

			const method = shippingMethods.find((sm) => sm.id === $shippingForm.shippingMethod);
			if (method) {
				checkoutStore.setShippingCost(method.price);
				checkoutStore.setEstimatedDays(method.estimatedDays);
			}
		}

		if (data.paymentForm?.success) {
			checkoutStore.updatePaymentConfig({
				cardNumber: $paymentForm.cardNumber,
				cardHolder: $paymentForm.cardHolder,
				expiryDate: $paymentForm.expiryDate,
				cvv: $paymentForm.cvv,
				savePaymentMethod: $paymentForm.savePaymentMethod
			});
		}
	});
</script>

<!-- <pre>{JSON.stringify($checkoutStore, null, 2)}</pre> -->
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
							{#if checkout.emailValidated}
								<div class="text-sm text-muted-foreground flex items-center gap-2">
									<User class="h-4 w-4" />
									<span>{$emailForm.email}</span>
								</div>
							{/if}
						</div>
					</Accordion.Trigger>
					<Accordion.Content>
						<div class="pt-4">
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
												aria-invalid={$emailErrors.email ? 'true' : undefined}
												{...$emailConstraints.email}
												onblur={() => handleFieldBlur('email', 'email')}
												oninput={async (e) => {
													// Always keep store in sync with form value
													checkoutStore.setEmail(e.currentTarget.value);
													// Also validate on input
													await validateEmail('email');
												}}
											/>
											{#if $emailErrors.email}
												<p class="text-sm text-destructive">{$emailErrors.email}</p>
											{/if}
										</div>
									</div>
								{/if}
							</div>
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
					{#if currentSection === 'shipping'}
						<Accordion.Content>
							<div class="pt-4">
								<div class="py-6">
									<div class="space-y-6">
										<!-- Country Selection -->
										<div class="grid gap-2">
											<Label for="country">{m.country()}</Label>
											{#if browser}
												<Select
													type="single"
													value={$shippingForm.country}
													onValueChange={async (value) => {
														// Update the form value
														$shippingForm.country = value;

														// Update the store
														checkoutStore.updateShippingConfig({ country: value });

														// Validate with new country rules
														await validateShipping('country');
													}}
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
											{#if $shippingErrors.country}
												<p class="text-sm text-destructive">{$shippingErrors.country[0]}</p>
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
													onblur={() => handleFieldBlur('firstName', 'shipping')}
													oninput={async () => {
														// Always keep store in sync with form value
														checkoutStore.updateShippingConfig({
															firstName: $shippingForm.firstName
														});
														// Also validate on input
														await validateShipping('firstName');
													}}
												/>
												{#if $shippingErrors.firstName}
													<p class="text-sm text-destructive">{$shippingErrors.firstName[0]}</p>
												{/if}
											</div>

											<div class="grid gap-2">
												<Label for="lastName">{m.checkout_last_name()}</Label>
												<Input
													type="text"
													name="lastName"
													bind:value={$shippingForm.lastName}
													required
													onblur={() => handleFieldBlur('lastName', 'shipping')}
													oninput={async () => {
														checkoutStore.updateShippingConfig({
															lastName: $shippingForm.lastName
														});
														await validateShipping('lastName');
													}}
												/>
												{#if $shippingErrors.lastName}
													<p class="text-sm text-destructive">{$shippingErrors.lastName[0]}</p>
												{/if}
											</div>

											<div class="grid gap-2 md:col-span-2">
												<Label for="addressLine1"
													>{checkout.addressStructure.labels.addressLine1}</Label
												>
												<Input
													type="text"
													name="addressLine1"
													bind:value={$shippingForm.addressLine1}
													placeholder={checkout.addressStructure.placeholders.addressLine1}
													required
													onblur={() => handleFieldBlur('addressLine1', 'shipping')}
													oninput={async () => {
														checkoutStore.updateShippingConfig({
															addressLine1: $shippingForm.addressLine1
														});
														await validateShipping('addressLine1');
													}}
												/>
												{#if $shippingErrors.addressLine1}
													<p class="text-sm text-destructive">{$shippingErrors.addressLine1[0]}</p>
												{/if}
											</div>

											<div class="grid gap-2 md:col-span-2">
												<Label for="addressLine2"
													>{checkout.addressStructure.labels.addressLine2}</Label
												>
												<Input
													type="text"
													name="addressLine2"
													bind:value={$shippingForm.addressLine2}
													placeholder={checkout.addressStructure.placeholders.addressLine2}
													onblur={() => handleFieldBlur('addressLine2', 'shipping')}
													oninput={(e) => {
														checkoutStore.updateShippingConfig({
															addressLine2: e.currentTarget.value || ''
														});
													}}
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
													onblur={() => handleFieldBlur('city', 'shipping')}
													oninput={async () => {
														checkoutStore.updateShippingConfig({
															city: $shippingForm.city
														});
														await validateShipping('city');
													}}
												/>
												{#if $shippingErrors.city}
													<p class="text-sm text-destructive">{$shippingErrors.city[0]}</p>
												{/if}
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
														onblur={() => handleFieldBlur('state', 'shipping')}
														oninput={async () => {
															checkoutStore.updateShippingConfig({
																state: $shippingForm.state
															});
															await validateShipping('state');
														}}
													/>
													{#if $shippingErrors.state}
														<p class="text-sm text-destructive">{$shippingErrors.state[0]}</p>
													{/if}
												</div>
											{/if}

											<div class="grid gap-2">
												<Label for="postalCode">{checkout.addressStructure.labels.postalCode}</Label
												>
												<Input
													type="text"
													name="postalCode"
													bind:value={$shippingForm.postalCode}
													placeholder={checkout.addressStructure.placeholders.postalCode}
													required
													onblur={() => handleFieldBlur('postalCode', 'shipping')}
													oninput={async () => {
														checkoutStore.updateShippingConfig({
															postalCode: $shippingForm.postalCode
														});
														await validateShipping('postalCode');
													}}
												/>
												{#if $shippingErrors.postalCode}
													<p class="text-sm text-destructive">{$shippingErrors.postalCode[0]}</p>
												{/if}
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
														onclick={() => {
															handleShippingMethodChange(method.id);
														}}
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
									</div>
								</div>
							</div>
						</Accordion.Content>
					{/if}
				</Accordion.Item>

				<!-- Payment Section -->
				<Accordion.Item
					value="payment"
					disabled={!checkout.emailValidated || !checkout.shippingValidated}
				>
					<Accordion.Trigger class="w-full py-4">
						<div class="flex items-center justify-between w-full">
							<h2 class="text-2xl font-semibold flex items-center gap-2">
								<CreditCard class="h-5 w-5" />
								{m.checkout_tab_payment()}
							</h2>
							{#if checkout.paymentValidated && currentSection !== 'payment' && checkout.paymentMethod}
								<div class="text-sm text-muted-foreground flex items-center gap-2">
									<CreditCard class="h-4 w-4" />
									<span>{checkout.paymentMethod}</span>
								</div>
							{:else if currentSection !== 'payment'}
								<div class="text-sm text-muted-foreground flex items-center gap-2">
									<CreditCard class="h-4 w-4" />
									<span>Not provided</span>
								</div>
							{/if}
						</div>
					</Accordion.Trigger>
					{#if currentSection === 'payment'}
						<Accordion.Content class="pt-4">
							<div class="py-6">
								<div class="space-y-6">
									<h3 class="text-lg font-medium">Payment Details</h3>

									<div class="grid grid-cols-1 gap-6">
										<!-- Card Number -->
										<div class="grid gap-2">
											<Label for="cardNumber">{m.checkout_card_number()}</Label>
											<Input
												type="text"
												name="cardNumber"
												bind:value={$paymentForm.cardNumber}
												placeholder="1234 5678 9012 3456"
												required
												onblur={() => handleFieldBlur('cardNumber', 'payment')}
												oninput={async () => {
													// Validate without storing
													await validatePayment('cardNumber');
												}}
											/>
											{#if $paymentErrors.cardNumber}
												<p class="text-sm text-destructive">{$paymentErrors.cardNumber}</p>
											{/if}
										</div>

										<!-- Card Holder -->
										<div class="grid gap-2">
											<Label for="cardHolder">{m.checkout_card_holder()}</Label>
											<Input
												type="text"
												name="cardHolder"
												bind:value={$paymentForm.cardHolder}
												placeholder="John Doe"
												required
												onblur={() => handleFieldBlur('cardHolder', 'payment')}
												oninput={async () => {
													// Validate without storing
													await validatePayment('cardHolder');
												}}
											/>
											{#if $paymentErrors.cardHolder}
												<p class="text-sm text-destructive">{$paymentErrors.cardHolder}</p>
											{/if}
										</div>

										<div class="grid grid-cols-2 gap-4">
											<!-- Expiry Date -->
											<div class="grid gap-2">
												<Label for="expiryDate">{m.checkout_expiry_date()}</Label>
												<Input
													type="text"
													name="expiryDate"
													bind:value={$paymentForm.expiryDate}
													placeholder="MM/YY"
													required
													onblur={() => handleFieldBlur('expiryDate', 'payment')}
													oninput={async () => {
														// Validate without storing
														await validatePayment('expiryDate');
													}}
												/>
												{#if $paymentErrors.expiryDate}
													<p class="text-sm text-destructive">{$paymentErrors.expiryDate}</p>
												{/if}
											</div>

											<!-- CVV -->
											<div class="grid gap-2">
												<Label for="cvv">{m.checkout_cvv()}</Label>
												<Input
													type="text"
													name="cvv"
													bind:value={$paymentForm.cvv}
													placeholder="123"
													required
													onblur={() => handleFieldBlur('cvv', 'payment')}
													oninput={async () => {
														// Validate without storing
														await validatePayment('cvv');
													}}
												/>
												{#if $paymentErrors.cvv}
													<p class="text-sm text-destructive">{$paymentErrors.cvv}</p>
												{/if}
											</div>
										</div>

										<!-- Save Payment Method Checkbox - Removed for security -->
									</div>
								</div>
							</div>
						</Accordion.Content>
					{/if}
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
