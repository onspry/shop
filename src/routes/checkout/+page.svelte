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
	import { superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { emailSchema } from '$lib/schemas/auth';
	import {
		shippingSchema,
		createShippingSchema,
		type ShippingSchema as ShippingZodSchema
	} from '$lib/schemas/shipping';
	import { paymentSchema } from '$lib/schemas/payment';
import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingBag, User, Truck, ImageOff, Mail, MapPin, Globe, Globe2, CreditCard } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { countries, addressStructures } from '$lib/config/address-structures';
	import { checkoutStore } from '$lib/stores/checkout';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';

	// Page data props
	const { data } = $props<{ data: PageData }>();

	// Image handling state
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

	// Initialize forms with proper types
	const emailSuperForm = superForm(data.emailForm, {
		validators: zod(emailSchema),
		validationMethod: 'onblur',
		taintedMessage: false
	});

	const {
		form: emailForm,
		errors: emailErrors,
		validate: validateEmail,
		constraints: emailConstraints,
		validateForm: validateEmailForm
	} = emailSuperForm;

	const shippingSuperForm = superForm(data.shippingForm, {
		validators: zod(shippingSchema),
		validationMethod: 'onblur',
		taintedMessage: false
	});

	const {
		form: shippingForm,
		errors: shippingErrors,
		validate: validateShipping,
		constraints: shippingConstraints,
		validateForm: validateShippingForm,
		options: shippingOptions
	} = shippingSuperForm;

	const paymentSuperForm = superForm(data.paymentForm, {
		validators: zod(paymentSchema),
		validationMethod: 'onblur',
		taintedMessage: false
	});

	const {
		form: paymentForm,
		errors: paymentErrors,
		validate: validatePayment,
		constraints: paymentConstraints,
		validateForm: validatePaymentForm
	} = paymentSuperForm;

	// Define schema after form initialization
	const currentCountrySchema = $derived<ShippingZodSchema>(
		createShippingSchema($shippingForm.country)
	);

	// Update form validators to use derived schema
	$effect(() => {
		shippingOptions.validators = zod(currentCountrySchema);
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
			// Ensure shipping method is also synced if present
			if ($checkoutStore.shippingConfig.shippingMethod) {
				$shippingForm.shippingMethod = $checkoutStore.shippingConfig.shippingMethod;
			}
		}
	});

	// Calculate tax based on subtotal (e.g., 8%)
	const calculateTax = (subtotal: number) => subtotal * 0.08;

	// Tax rate as percentage for display
	const taxRate = 8;

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
		// Payment details
		cardNumber: $paymentForm.cardNumber,
		cardHolder: $paymentForm.cardHolder,
		expiryDate: $paymentForm.expiryDate,
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
			? data.cart.total + $checkoutStore.shippingCost + calculateTax(data.cart.subtotal)
			: data.cart.subtotal - (data.cart.discountAmount || 0),
		// User info
		isLoggedIn: !!data.user
	});

	// Add derived state to check for section errors
	const formErrors = $derived({
		email: $emailErrors.email !== undefined && $emailErrors.email !== null,
		shipping: Object.values($shippingErrors).some((error) => error !== undefined && error !== null),
		payment: Object.values($paymentErrors).some((error) => error !== undefined && error !== null)
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

		// Set payment form from store
		if ($checkoutStore.paymentConfig) {
			$paymentForm.cardNumber = $checkoutStore.paymentConfig.cardNumber || '';
			$paymentForm.cardHolder = $checkoutStore.paymentConfig.cardHolder || '';
			$paymentForm.expiryDate = $checkoutStore.paymentConfig.expiryDate || '';
			$paymentForm.cvv = $checkoutStore.paymentConfig.cvv || '';
			$paymentForm.savePaymentMethod = $checkoutStore.paymentConfig.savePaymentMethod || false;
		}

		// Explicitly validate email form after setting values
		if ($emailForm.email) {
			await validateEmailForm();
		}
	});

	// Add function to show validation feedback using toast
	function showValidationFeedback(message: string) {
		toast.error(message, {
			duration: 3000
		});
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

	// Add a more detailed error indicator for shipping information
	const shippingErrorDetails = $derived({
		firstName: $shippingErrors.firstName !== undefined,
		lastName: $shippingErrors.lastName !== undefined,
		addressLine1: $shippingErrors.addressLine1 !== undefined,
		city: $shippingErrors.city !== undefined,
		state: $shippingErrors.state !== undefined,
		postalCode: $shippingErrors.postalCode !== undefined,
		get hasErrors() {
			return (
				this.firstName ||
				this.lastName ||
				this.addressLine1 ||
				this.city ||
				this.state ||
				this.postalCode
			);
		},
		get errorCount() {
			return [
				this.firstName,
				this.lastName,
				this.addressLine1,
				this.city,
				this.state,
				this.postalCode
			].filter(Boolean).length;
		}
	});

	// Add a more detailed error indicator for payment information
	const paymentErrorDetails = $derived({
		cardNumber: $paymentErrors.cardNumber !== undefined,
		cardHolder: $paymentErrors.cardHolder !== undefined,
		expiryDate: $paymentErrors.expiryDate !== undefined,
		cvv: $paymentErrors.cvv !== undefined,
		get hasErrors() {
			return (
				this.cardNumber ||
				this.cardHolder ||
				this.expiryDate ||
				this.cvv
			);
		},
		get errorCount() {
			return [
				this.cardNumber,
				this.cardHolder,
				this.expiryDate,
				this.cvv
			].filter(Boolean).length;
		}
	});

	// Handle place order
	async function placeOrder() {
		// 1. Validate Email, Shipping, and Payment before placing order
		const emailValid = await validateEmailForm();
		const shippingValid = await validateShippingForm();
		const paymentValid = await validatePaymentForm();

		if (!emailValid.valid) {
			showValidationFeedback('Please correct the errors in the email section.');
			// Force validation on email field
			await validateEmail('email');
			// Scroll to email section
			const emailSection = document.querySelector('[data-section="email"]');
			if (emailSection) {
				emailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			return;
		}
		if (!shippingValid.valid) {
			showValidationFeedback('Please correct the errors in the shipping section.');
			// Force validation on all shipping fields
			await validateShipping('firstName');
			await validateShipping('lastName');
			await validateShipping('addressLine1');
			await validateShipping('city');
			await validateShipping('state');
			await validateShipping('postalCode');
			await validateShipping('country');
			// Scroll to shipping section
			const shippingSection = document.querySelector('[data-section="shipping"]');
			if (shippingSection) {
				shippingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			return;
		}
		if (!paymentValid.valid) {
			showValidationFeedback('Please correct the errors in the payment section.');
			// Force validation on all payment fields
			await validatePayment('cardNumber');
			await validatePayment('cardHolder');
			await validatePayment('expiryDate');
			await validatePayment('cvv');
			// Scroll to payment section
			const paymentSection = document.querySelector('[data-section="payment"]');
			if (paymentSection) {
				paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			return;
		}

		// 2. Update store with latest validated data
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

		// Update payment config in store
		checkoutStore.updatePaymentConfig({
			cardNumber: $paymentForm.cardNumber,
			cardHolder: $paymentForm.cardHolder,
			expiryDate: $paymentForm.expiryDate,
			cvv: $paymentForm.cvv,
			savePaymentMethod: $paymentForm.savePaymentMethod
		});

		// 3. Proceed with placing the order (replace with actual API call)
		console.log('Placing order with:', $checkoutStore);
		// TODO: Replace console log with actual order submission logic

		// 4. Show success feedback
		toast.success('Order placed successfully!', { duration: 3000 });
	}

	// Simplify handleCountryChange - Postal code revalidation moved here
	async function handleCountryChange(value: string) {
		// Update shipping form country
		$shippingForm.country = value;

		// Update shipping config in store
		$checkoutStore.shippingConfig = {
			...$checkoutStore.shippingConfig,
			country: value
		};

		// Revalidate postal code with new country rules
		await validateShipping('postalCode');
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Main checkout flow -->
		<div class="lg:col-span-7">
			<!-- Email Section -->
			<div class="mb-8" data-section="email">
				<div class="flex items-center justify-between w-full mb-6">
					<h2 class="text-2xl font-semibold flex items-center gap-2">
						<Mail class="h-5 w-5" />
						{m.checkout_contact_info_title()}
						{#if formErrors.email}
							<span
								class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive ml-2 error-indicator"
							>
								<span class="text-xs font-bold text-destructive-foreground">!</span>
							</span>
						{/if}
					</h2>
				</div>

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
						<div class="flex items-center justify-between mb-4">
							<div class="text-sm text-muted-foreground">
								Already have an account?
								<a href="/auth/login?redirect=/checkout" class="text-primary hover:underline ml-1"
									>Log in</a
								>
							</div>
						</div>

						<form>
							<Form.Field form={emailSuperForm} name="email">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Email</Form.Label>
										<Input
											{...props}
											type="email"
											bind:value={$emailForm.email}
											placeholder="Email"
											aria-invalid={$emailErrors.email ? 'true' : undefined}
											{...$emailConstraints.email}
											oninput={async (e: any) => {
												checkoutStore.setEmail(e.currentTarget.value);
												await validateEmail('email');
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.Description>We'll send your order confirmation here</Form.Description>
								<Form.FieldErrors />
							</Form.Field>
						</form>
					{/if}
				</div>
			</div>

			<!-- Shipping Section -->
			<div class="mb-8" data-section="shipping">
				<div class="flex items-center justify-between w-full mb-6">
					<h2 class="text-2xl font-semibold flex items-center gap-2">
						<MapPin class="h-5 w-5" />
						{m.checkout_tab_shipping()}
						{#if formErrors.shipping}
							<span
								class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive ml-2 error-indicator"
							>
								<span class="text-xs font-bold text-destructive-foreground">
									{shippingErrorDetails.errorCount > 0 ? shippingErrorDetails.errorCount : '!'}
								</span>
							</span>
						{/if}
					</h2>
				</div>

				<form>
					<div class="grid gap-6">
						<!-- Country Selection -->
						<Form.Field form={shippingSuperForm} name="country">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{m.country()}</Form.Label>
									{#if browser}
										<Select
											type="single"
											value={$shippingForm.country}
											onValueChange={handleCountryChange}
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
										<Input type="text" {...props} value={$shippingForm.country} readonly />
									{/if}
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<!-- Name Fields -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Form.Field form={shippingSuperForm} name="firstName">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>{m.checkout_first_name()}</Form.Label>
										<Input
											{...props}
											bind:value={$shippingForm.firstName}
											onblur={async () => {
												await validateShipping('firstName');
											}}
											oninput={() => {
												checkoutStore.updateShippingConfig({
													firstName: $shippingForm.firstName
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field form={shippingSuperForm} name="lastName">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>{m.checkout_last_name()}</Form.Label>
										<Input
											{...props}
											bind:value={$shippingForm.lastName}
											onblur={async () => {
												await validateShipping('lastName');
											}}
											oninput={() => {
												checkoutStore.updateShippingConfig({
													lastName: $shippingForm.lastName
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<!-- Address Fields -->
						<Form.Field form={shippingSuperForm} name="addressLine1">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{checkout.addressStructure.labels.addressLine1}</Form.Label>
									<Input
										{...props}
										bind:value={$shippingForm.addressLine1}
										onblur={async () => {
											await validateShipping('addressLine1');
										}}
										oninput={() => {
											checkoutStore.updateShippingConfig({
												addressLine1: $shippingForm.addressLine1
											});
										}}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={shippingSuperForm} name="addressLine2">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>{checkout.addressStructure.labels.addressLine2}</Form.Label>
									<Input
										{...props}
										bind:value={$shippingForm.addressLine2}
										placeholder={checkout.addressStructure.placeholders.addressLine2}
										oninput={(e: any) => {
											checkoutStore.updateShippingConfig({
												addressLine2: e.currentTarget.value || ''
											});
										}}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>

						<!-- City, State, ZIP -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Form.Field form={shippingSuperForm} name="city">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>{checkout.addressStructure.labels.city}</Form.Label>
										<Input
											{...props}
											bind:value={$shippingForm.city}
											onblur={async () => {
												await validateShipping('city');
											}}
											oninput={() => {
												checkoutStore.updateShippingConfig({
													city: $shippingForm.city
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							{#if checkout.addressStructure.fields.includes('state') || checkout.addressStructure.fields.includes('prefecture') || checkout.addressStructure.fields.includes('province') || checkout.addressStructure.fields.includes('county')}
								<Form.Field form={shippingSuperForm} name="state">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>
												{checkout.addressStructure.labels.state ||
													checkout.addressStructure.labels.prefecture ||
													checkout.addressStructure.labels.province ||
													checkout.addressStructure.labels.county}
											</Form.Label>
											<Input
												{...props}
												bind:value={$shippingForm.state}
												placeholder={checkout.addressStructure.placeholders.state ||
													checkout.addressStructure.placeholders.prefecture ||
													checkout.addressStructure.placeholders.province ||
													checkout.addressStructure.placeholders.county}
												oninput={async () => {
													checkoutStore.updateShippingConfig({
														state: $shippingForm.state
													});
													await validateShipping('state');
												}}
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							{/if}

							<Form.Field form={shippingSuperForm} name="postalCode">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>{checkout.addressStructure.labels.postalCode}</Form.Label>
										<Input
											{...props}
											bind:value={$shippingForm.postalCode}
											onblur={async () => {
												await validateShipping('postalCode');
											}}
											oninput={() => {
												checkoutStore.updateShippingConfig({
													postalCode: $shippingForm.postalCode
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<!-- Shipping Method -->
						<div class="grid gap-4">
							<h3 class="text-lg font-medium">{m.checkout_shipping_method()}</h3>
							<Form.Field form={shippingSuperForm} name="shippingMethod">
								<Form.Control>
									{#snippet children({ props })}
										<div
											class="grid gap-2"
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
									{/snippet}
								</Form.Control>
							</Form.Field>
						</div>
					</div>
				</form>
			</div>

			<!-- Payment Section -->
			<div class="mb-8" data-section="payment">
				<div class="flex items-center justify-between w-full mb-6">
					<h2 class="text-2xl font-semibold flex items-center gap-2">
						<CreditCard class="h-5 w-5" />
						Payment Information
						{#if formErrors.payment}
							<span
								class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive ml-2 error-indicator"
							>
								<span class="text-xs font-bold text-destructive-foreground">
									{paymentErrorDetails.errorCount > 0 ? paymentErrorDetails.errorCount : '!'}
								</span>
							</span>
						{/if}
					</h2>
				</div>

				<form>
					<div class="grid gap-6">
						<!-- Card Number -->
						<Form.Field form={paymentSuperForm} name="cardNumber">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Card Number</Form.Label>
									<Input
										{...props}
										bind:value={$paymentForm.cardNumber}
										placeholder="1234 5678 9012 3456"
										onblur={async () => {
											await validatePayment('cardNumber');
										}}
										oninput={() => {
											checkoutStore.updatePaymentConfig({
												cardNumber: $paymentForm.cardNumber
											});
										}}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<!-- Card Holder -->
						<Form.Field form={paymentSuperForm} name="cardHolder">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Cardholder Name</Form.Label>
									<Input
										{...props}
										bind:value={$paymentForm.cardHolder}
										placeholder="John Doe"
										onblur={async () => {
											await validatePayment('cardHolder');
										}}
										oninput={() => {
											checkoutStore.updatePaymentConfig({
												cardHolder: $paymentForm.cardHolder
											});
										}}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<!-- Expiry Date and CVV -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Form.Field form={paymentSuperForm} name="expiryDate">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Expiry Date</Form.Label>
										<Input
											{...props}
											bind:value={$paymentForm.expiryDate}
											placeholder="MM/YY"
											onblur={async () => {
												await validatePayment('expiryDate');
											}}
											oninput={() => {
												checkoutStore.updatePaymentConfig({
													expiryDate: $paymentForm.expiryDate
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field form={paymentSuperForm} name="cvv">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>CVV</Form.Label>
										<Input
											{...props}
											bind:value={$paymentForm.cvv}
											type="password"
											placeholder="123"
											onblur={async () => {
												await validatePayment('cvv');
											}}
											oninput={() => {
												checkoutStore.updatePaymentConfig({
													cvv: $paymentForm.cvv
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<!-- Save Payment Method -->
						<div class="flex items-center space-x-2">
							<input
								type="checkbox"
								id="savePaymentMethod"
								bind:checked={$paymentForm.savePaymentMethod}
								onchange={() => {
									checkoutStore.updatePaymentConfig({
										savePaymentMethod: $paymentForm.savePaymentMethod
									});
								}}
								class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<label for="savePaymentMethod" class="text-sm text-muted-foreground">
								Save this payment method for future purchases
							</label>
						</div>
					</div>
				</form>
			</div>
		</div>

		<!-- Order summary -->
		<div class="lg:col-span-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
			<div class="flex items-center justify-between w-full mb-6">
				<h2 class="text-2xl font-semibold flex items-center gap-2">
					<ShoppingBag class="h-5 w-5" />
					{m.checkout_order_summary()}
				</h2>
			</div>

			<div class="bg-background rounded-lg space-y-6">
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
						<span class="text-muted-foreground">{m.cart_subtotal()}</span>
						<span>{formatPrice(data.cart.subtotal)}</span>
					</div>

					<div class="flex justify-between text-base">
						<span class="text-muted-foreground">{m.cart_shipping()}</span>
						{#if !checkout.shippingValidated}
							<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
						{:else}
							<span>{formatPrice(checkout.shippingCost)}</span>
						{/if}
					</div>

					<div class="flex justify-between text-base">
						<span class="text-muted-foreground">{m.cart_tax()} ({taxRate}%)</span>
						{#if !checkout.shippingValidated}
							<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
						{:else}
							<span>{formatPrice(calculateTax(data.cart.subtotal))}</span>
						{/if}
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
						{#if !checkout.shippingValidated}
							<span class="text-muted-foreground">{m.cart_calculated_at_next_step()}</span>
						{:else}
							<span>{formatPrice(checkout.total)}</span>
						{/if}
					</div>
				</div>

				<!-- Estimated Delivery -->
				{#if checkout.shippingValidated && checkout.shippingAddress && checkout.shippingMethod && checkout.estimatedDays && checkout.shippingAddress.addressLine1}
					<div class="border-t pt-6">
						<div class="flex items-center gap-2 text-base">
							<Truck class="h-5 w-5 text-primary" />
							<span class="font-medium">{m.checkout_estimated_delivery()}</span>
							<span class="text-muted-foreground"
								>({checkout.estimatedDays} {m.shipping_business_days()})</span
							>
						</div>
						<div class="mt-4 ml-7 space-y-1">
							<div class="flex items-center gap-2">
								<User class="h-4 w-4 text-primary" />
								<span>{checkout.shippingAddress.firstName} {checkout.shippingAddress.lastName}</span
								>
							</div>
							<div class="flex items-center gap-2">
								<MapPin class="h-4 w-4 text-primary" />
								<span>{checkout.shippingAddress.addressLine1}</span>
							</div>
							{#if checkout.shippingAddress.addressLine2}
								<div class="flex items-center gap-2">
									<span class="ml-6">{checkout.shippingAddress.addressLine2}</span>
								</div>
							{/if}
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4 text-primary" />
								<span
									>{checkout.shippingAddress.city}, {checkout.shippingAddress.state}
									{checkout.shippingAddress.postalCode}</span
								>
							</div>
							<div class="flex items-center gap-2">
								<Globe2 class="h-4 w-4 text-primary" />
								<span>{checkout.shippingAddress.country}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Moved Place Order Button and Text -->
				<div class="pt-6 border-t">
					<Button
						class="w-full"
						size="lg"
						onclick={placeOrder}
						disabled={!checkout.emailValidated || !checkout.shippingValidated || !checkout.paymentValidated}
					>
						{m.checkout_place_order()}
					</Button>
					<p class="text-center text-xs text-muted-foreground/60 mt-2">
						{m.checkout_secure_transaction()}
					</p>
				</div>

				<!-- Moved Terms Agreement -->
				<div class="text-xs text-muted-foreground/60 text-center space-y-1.5 border-t pt-6">
					<p>{m.cart_terms_agreement()}</p>
				</div>
			</div>
		</div>
	</div>
</div>
