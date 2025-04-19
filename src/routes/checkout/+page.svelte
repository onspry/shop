<script lang="ts">
	import { Input } from '$lib/components/ui/input';
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
	import {
		ShoppingBag,
		User,
		Truck,
		ImageOff,
		Mail,
		MapPin,
		CreditCard,
		Check
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';

	import { countries, addressStructures } from '$lib/config/address-structures';
	import { checkoutStore } from '$lib/stores/checkout';
	import { cart } from '$lib/stores/cart';
	import { userStore } from '$lib/stores/auth';

	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';


	// Page data props
	const { data } = $props<{ data: PageData }>();

	// Image handling state
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

	// We validate based on field values and error states
	// Track the active step (1: Email, 2: Shipping, 3: Payment)
	let activeStep = $state(1);

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
		// Validation states check if fields are filled and error-free
		emailValidated: $emailForm.email && $emailErrors.email === undefined,
		get shippingValidated() {
			// Get the address structure for the selected country
			const countryStructure = addressStructures[$shippingForm.country] || addressStructures.DEFAULT;

			// Check if state is required for this country
			const stateRequired = countryStructure.fields.includes('state');

			// Basic required fields check
			const basicFieldsValid =
				$shippingForm.firstName &&
				$shippingForm.lastName &&
				$shippingForm.addressLine1 &&
				$shippingForm.city &&
				$shippingForm.postalCode &&
				$shippingForm.country &&
				$shippingForm.shippingMethod;

			// State field check - only require if needed for this country
			const stateFieldValid = !stateRequired || (stateRequired && $shippingForm.state);

			// No validation errors
			const noValidationErrors = Object.values($shippingErrors).every((error) => error === undefined);

			return basicFieldsValid && stateFieldValid && noValidationErrors;
		},
		paymentValidated:
			$paymentForm.cardNumber &&
			$paymentForm.cardHolder &&
			$paymentForm.expiryDate &&
			$paymentForm.cvv &&
			Object.values($paymentErrors).every((error) => error === undefined),

		// Current step calculation based on validation state
		get currentStep() {
			if (this.paymentValidated) return 3;
			if (this.shippingValidated) return 2;
			if (this.emailValidated) return 1;
			return 0;
		},
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
		$shippingForm.shippingMethod = $checkoutStore.shippingConfig.shippingMethod || '';

		// Persist firstName and lastName from user data to checkoutStore if user is logged in and not already set
		if (data.user) {
			$checkoutStore.shippingConfig = {
				...$checkoutStore.shippingConfig,
				firstName: $checkoutStore.shippingConfig.firstName || data.user.firstName || '',
				lastName: $checkoutStore.shippingConfig.lastName || data.user.lastName || ''
			};
		}

		// Set payment form from store
		if ($checkoutStore.paymentConfig) {

		// Explicitly validate shipping form after setting values
		await validateShippingForm();
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
			return this.cardNumber || this.cardHolder || this.expiryDate || this.cvv;
		},
		get errorCount() {
			return [this.cardNumber, this.cardHolder, this.expiryDate, this.cvv].filter(Boolean).length;
		}
	});


	// Functions to navigate between steps
	async function goToNextStep() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (activeStep === 1 && checkout.emailValidated) {
			activeStep = 2;
		} else if (activeStep === 2 && checkout.shippingValidated) {
			activeStep = 3;
		}
	}

	function goToPreviousStep() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (activeStep > 1) {
			activeStep--;
		}
	}

	function goToStep(step: number) {
		// Only allow going to a step if previous steps are validated
		if (step === 1) {
			activeStep = 1;
		} else if (step === 2 && checkout.emailValidated) {
			activeStep = 2;
		} else if (step === 3 && checkout.emailValidated && checkout.shippingValidated) {
			activeStep = 3;
		}
	}

	// Handle country change with proper field reset
	async function handleCountryChange(value: string) {
		// Store the previous country for comparison
		const previousCountry = $shippingForm.country;

		// Update shipping form country
		$shippingForm.country = value;

		// Update shipping config in store
		$checkoutStore.shippingConfig = {
			...$checkoutStore.shippingConfig,
			country: value
		};

		// If the country has changed, reset the postal code field
		// This prevents validation errors when switching countries
		if (previousCountry !== value) {
			// Clear the postal code value
			// $shippingForm.postalCode = '';

			// Update the store
			// checkoutStore.updateShippingConfig({
			// 	postalCode: ''
			// });

			// Clear any existing postal code validation errors
			// $shippingErrors.postalCode = undefined;

			// Don't focus or validate the postal code field on country change
			// Let the user interact with it when they're ready
		}
	}
</script>

<div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Checkout Progress Indicator -->
	<div class="mb-8 relative">
		<div class="hidden sm:block h-0.5 w-full bg-muted absolute top-5 left-0"></div>
		<ol class="relative grid grid-cols-3 w-full">
			<!-- Email Step -->
			<li class="flex flex-col items-center">
				<button class="flex flex-col items-center focus:outline-none" onclick={() => goToStep(1)}>
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-colors duration-300 mb-2"
						class:bg-primary={checkout.currentStep >= 1 || activeStep === 1}
						class:border-primary={checkout.currentStep >= 1 || activeStep === 1}
						class:text-primary-foreground={checkout.currentStep >= 1 || activeStep === 1}
						class:border-muted={checkout.currentStep < 1 && activeStep !== 1}
						class:bg-background={checkout.currentStep < 1 && activeStep !== 1}
						class:opacity-100={activeStep === 1}
						class:opacity-60={checkout.currentStep >= 1 && activeStep !== 1}
					>
						{#if checkout.emailValidated}
							<Check class="h-5 w-5" />
						{:else}
							<span class="text-sm font-medium">1</span>
						{/if}
					</div>
					<span class="text-sm font-medium">{m.checkout_contact_info_title()}</span>
				</button>
			</li>

			<!-- Shipping Step -->
			<li class="flex flex-col items-center">
				<button
					class="flex flex-col items-center focus:outline-none"
					onclick={() => goToStep(2)}
					disabled={!checkout.emailValidated}
				>
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-colors duration-300 mb-2"
						class:bg-primary={checkout.currentStep >= 2 || activeStep === 2}
						class:border-primary={checkout.currentStep >= 2 || activeStep === 2}
						class:text-primary-foreground={checkout.currentStep >= 2 || activeStep === 2}
						class:border-muted={checkout.currentStep < 2 && activeStep !== 2}
						class:bg-background={checkout.currentStep < 2 && activeStep !== 2}
						class:opacity-100={activeStep === 2}
						class:opacity-60={checkout.currentStep >= 2 && activeStep !== 2}
					>
						{#if checkout.shippingValidated}
							<Check class="h-5 w-5" />
						{:else}
							<span class="text-sm font-medium">2</span>
						{/if}
					</div>
					<span class="text-sm font-medium">{m.checkout_tab_shipping()}</span>
				</button>
			</li>

			<!-- Payment Step -->
			<li class="flex flex-col items-center">
				<button
					class="flex flex-col items-center focus:outline-none"
					onclick={() => goToStep(3)}
					disabled={!checkout.emailValidated || !checkout.shippingValidated}
				>
					<div
						class="flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-colors duration-300 mb-2"
						class:bg-primary={checkout.currentStep >= 3 || activeStep === 3}
						class:border-primary={checkout.currentStep >= 3 || activeStep === 3}
						class:text-primary-foreground={checkout.currentStep >= 3 || activeStep === 3}
						class:border-muted={checkout.currentStep < 3 && activeStep !== 3}
						class:bg-background={checkout.currentStep < 3 && activeStep !== 3}
						class:opacity-100={activeStep === 3}
						class:opacity-60={checkout.currentStep >= 3 && activeStep !== 3}
					>
						{#if checkout.paymentValidated}
							<Check class="h-5 w-5" />
						{:else}
							<span class="text-sm font-medium">3</span>
						{/if}
					</div>
					<span class="text-sm font-medium">{m.checkout_tab_payment()}</span>
				</button>
			</li>
		</ol>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
		<!-- Main checkout flow -->
		<div class="lg:col-span-7">
			<!-- Email Section -->
			<div class="mb-8" data-section="email" class:hidden={activeStep !== 1}>
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
					<!-- Navigation Buttons -->
					<div class="mt-8 border-t pt-6">
						<div class="flex justify-between items-center">
							<div>
								<!-- No back button on first step -->
							</div>
							<Button
								class="w-full md:w-auto"
								onclick={goToNextStep}
								disabled={!checkout.emailValidated}
							>
								<span class="flex items-center gap-2">
									Continue to Shipping
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								</span>
							</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Shipping Section -->
			<div class="mb-8" data-section="shipping" class:hidden={activeStep !== 2}>
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
										<Form.Label>{m.checkout_first_name()} <span class="text-red-600" aria-label="required">*</span></Form.Label>
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
										<Form.Label>{m.checkout_last_name()} <span class="text-red-600" aria-label="required">*</span></Form.Label>
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
									<Form.Label>{checkout.addressStructure.labels.addressLine1} <span class="text-red-600" aria-label="required">*</span></Form.Label>
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
										<Form.Label>{checkout.addressStructure.labels.city} <span class="text-red-600" aria-label="required">*</span></Form.Label>
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
												checkout.addressStructure.labels.county} <span class="text-red-600" aria-label="required">*</span>
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
										<Form.Label>{checkout.addressStructure.labels.postalCode} <span class="text-red-600" aria-label="required">*</span></Form.Label>
										<Input
											{...props}
											bind:value={$shippingForm.postalCode}
											onblur={async () => {
												// Only validate when the user explicitly interacts with the field
												if (document.activeElement !== document.querySelector('[name="country"]')) {
													await validateShipping('postalCode');
												}
											}}
											oninput={() => {
												// Clear validation errors when user starts typing
												$shippingErrors.postalCode = undefined;

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

				<!-- Navigation Buttons -->
				<div class="mt-8 border-t pt-6">
					<div class="flex justify-between items-center">
						<Button variant="outline" class="md:w-auto" onclick={goToPreviousStep}>
							<span class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								Back to Contact
							</span>
						</Button>
						<Button class="md:w-auto" onclick={goToNextStep} disabled={!checkout.shippingValidated}>
							<span class="flex items-center gap-2">
								Continue to Payment
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						</Button>
					</div>
				</div>
			</div>

			<!-- Payment Section -->
			<div class="mb-8" data-section="payment" class:hidden={activeStep !== 3}>
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

				<!-- Credit Card Visual Preview -->
				<!-- <div class="mb-6 relative">
					<div
						class="bg-gradient-to-r from-primary/80 to-primary rounded-xl p-6 text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg"
					>
						<div class="flex justify-between items-start mb-8">
							<div class="w-12 h-8 bg-white/20 rounded-md"></div>
							<CreditCard class="h-8 w-8 text-primary-foreground/80" />
						</div>
						<div class="mb-6">
							<p class="text-lg font-mono tracking-widest">
								{$paymentForm.cardNumber
									? $paymentForm.cardNumber
											.replace(/\s/g, '')
											.replace(/(.{4})/g, '$1 ')
											.trim()
									: '•••• •••• •••• ••••'}
							</p>
						</div>
						<div class="flex justify-between items-center">
							<div>
								<p class="text-xs text-primary-foreground/70 mb-1">Card Holder</p>
								<p class="font-medium uppercase tracking-wider">
									{$paymentForm.cardHolder || 'YOUR NAME'}
								</p>
							</div>
							<div>
								<p class="text-xs text-primary-foreground/70 mb-1">Expires</p>
								<p class="font-medium">{$paymentForm.expiryDate || 'MM/YY'}</p>
							</div>
						</div>
					</div>
				</div> -->

				<form>
					<div class="grid gap-6">
						<!-- Card Number -->
						<Form.Field form={paymentSuperForm} name="cardNumber">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Card Number</Form.Label>
									<div class="relative">
										<Input
											{...props}
											bind:value={$paymentForm.cardNumber}
											placeholder="1234 5678 9012 3456"
											style="padding-right: 2.5rem;"
											maxlength={19}
											onblur={async () => {
												await validatePayment('cardNumber');
											}}
											oninput={(e) => {
												// Remove all non-digits
												let value = e.currentTarget.value.replace(/\D/g, '');

												// Limit to 16 digits
												value = value.substring(0, 16);

												// Format with spaces after every 4 digits
												const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

												$paymentForm.cardNumber = formattedValue;
												checkoutStore.updatePaymentConfig({
													cardNumber: formattedValue
												});
											}}
										/>
										<div class="absolute right-3 top-1/2 -translate-y-1/2">
											<CreditCard class="h-5 w-5 text-muted-foreground" />
										</div>
									</div>
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
											oninput={(e) => {
												// Format expiry date as MM/YY
												const value = e.currentTarget.value.replace(/\D/g, '');
												let formattedValue = value;

												// Add slash after first two digits
												if (value.length > 2) {
													formattedValue = value.substring(0, 2) + '/' + value.substring(2, 4);
												} else if (value.length === 2) {
													formattedValue = value + '/';
												}

												$paymentForm.expiryDate = formattedValue;
												checkoutStore.updatePaymentConfig({
													expiryDate: formattedValue
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
											oninput={(e) => {
												// Only allow numbers and limit to 4 digits
												const value = e.currentTarget.value.replace(/\D/g, '').substring(0, 4);
												$paymentForm.cvv = value;
												checkoutStore.updatePaymentConfig({
													cvv: value
												});
											}}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<!-- Security Badges -->
						<div class="mt-4 p-4 bg-muted/20 rounded-lg border border-muted">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center">
									<div class="mr-2 p-1 bg-green-100 rounded-full">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 text-green-600"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium">Secure Payment</span>
								</div>
								<div class="flex items-center">
									<div class="mr-2 p-1 bg-blue-100 rounded-full">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 text-blue-600"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<span class="text-sm font-medium">Encrypted Data</span>
								</div>
							</div>
							<p class="text-xs text-muted-foreground">
								Your payment information is securely processed and encrypted. We do not store your
								full card details on our servers.
							</p>
						</div>

						<!-- Save Payment Method -->
						<div class="flex items-center space-x-2 mt-4">
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

				<!-- Navigation Buttons -->
				<div class="mt-8 border-t pt-6">
					<div class="flex justify-between items-center">
						<Button variant="outline" class="md:w-auto" onclick={goToPreviousStep}>
							<span class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								Back to Shipping
							</span>
						</Button>
					</div>
				</div>
			</div>
		</div>

		<!-- Order summary -->
		<div class="lg:col-span-5">
			<div class="lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
				<!-- Mobile Order Summary Toggle -->
				<div class="block lg:hidden mb-4">
					<button
						class="w-full flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-muted hover:bg-muted/30 transition-colors"
						onclick={() => {
							// Toggle mobile summary visibility
							const summaryElement = document.getElementById('mobile-order-summary');
							if (summaryElement) {
								summaryElement.classList.toggle('hidden');
							}
						}}
					>
						<div class="flex items-center gap-2">
							<ShoppingBag class="h-5 w-5" />
							<span class="font-medium">{m.checkout_order_summary()}</span>
							<span class="text-sm text-muted-foreground ml-1">({data.cart.items.length} {data.cart.items.length === 1 ? 'item' : 'items'})</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="font-medium">{formatPrice(data.cart.total)}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					</button>
				</div>

				<!-- Desktop Order Summary Title -->
				<div class="hidden lg:flex items-center justify-between w-full mb-6">
					<h2 class="text-2xl font-semibold flex items-center gap-2">
						<ShoppingBag class="h-5 w-5" />
						{m.checkout_order_summary()}
					</h2>
				</div>

				<div
					id="mobile-order-summary"
					class="hidden lg:block bg-background rounded-lg space-y-6 shadow-sm border border-muted/50 p-4"
				>
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
												<div>
													<p class="font-medium">{item.variant?.name || item.name}</p>
												</div>
												<p class="font-medium ml-4">{formatPrice(item.price * item.quantity)}</p>
											</div>
											{#if item.composites && item.composites.length > 0}
												<div class="mt-1 space-y-1">
													{#each item.composites as composite}
														<div class="flex items-center gap-1">
															<div class="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
															<p class="text-sm text-muted-foreground">
																{composite.name}
															</p>
														</div>
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

					<!-- Shipping Information -->
					{#if checkout.shippingValidated && checkout.shippingAddress && checkout.shippingMethod && checkout.estimatedDays && checkout.shippingAddress.addressLine1}
						<div class="border-t pt-6">
							<h3 class="font-medium text-base mb-4 flex items-center gap-2">
								<MapPin class="h-5 w-5 text-primary" />
								{m.checkout_tab_shipping()}
							</h3>

							<!-- Shipping Address Card -->
							<div class="bg-muted/20 rounded-lg p-4 border border-muted/40 mb-4">
								<div class="flex items-center gap-2 mb-2">
									<User class="h-4 w-4 text-primary" />
									<span class="font-medium">
										{checkout.shippingAddress.firstName}
										{checkout.shippingAddress.lastName}
									</span>
								</div>

								<div class="ml-6 text-muted-foreground">
									<p>{checkout.shippingAddress.addressLine1}</p>
									{#if checkout.shippingAddress.addressLine2}
										<p>{checkout.shippingAddress.addressLine2}</p>
									{/if}
									<p>
										{checkout.shippingAddress.city}, {checkout.shippingAddress.state}
										{checkout.shippingAddress.postalCode}
									</p>
									<div class="flex items-center gap-2 mt-1">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 text-primary"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="2" y1="12" x2="22" y2="12"></line>
											<path
												d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
											></path>
										</svg>
										<span>{checkout.shippingAddress.country}</span>
									</div>
								</div>
							</div>

							<!-- Delivery Estimate -->
							<div
								class="flex items-center gap-2 text-sm bg-muted/20 rounded-lg p-3 border border-muted/40"
							>
								<Truck class="h-5 w-5 text-primary" />
								<div>
									<span class="font-medium">{m.checkout_estimated_delivery()}</span>
									<span class="text-muted-foreground ml-1"
										>({checkout.estimatedDays} {m.shipping_business_days()})</span
									>
								</div>
							</div>
						</div>
					{/if}

					<!-- Payment Information -->
					{#if checkout.paymentValidated && $paymentForm.cardNumber && $paymentForm.cardHolder}
						<div class="border-t pt-6">
							<h3 class="font-medium text-base mb-4 flex items-center gap-2">
								<CreditCard class="h-5 w-5 text-primary" />
								{m.checkout_tab_payment()}
							</h3>

							<!-- Payment Card Preview -->
							<div
								class="bg-gradient-to-r from-primary/80 to-primary rounded-lg p-4 text-primary-foreground mb-4 shadow-sm"
							>
								<div class="flex justify-between items-center mb-2">
									<div class="w-10 h-6 bg-white/20 rounded-md"></div>
									<CreditCard class="h-6 w-6 text-primary-foreground/80" />
								</div>
								<div class="font-mono tracking-wider mb-1">
									•••• •••• •••• {$paymentForm.cardNumber.slice(-4)}
								</div>
								<div class="flex justify-between items-center text-sm">
									<span class="text-primary-foreground/80">{$paymentForm.cardHolder}</span>
									<span class="text-primary-foreground/80">{$paymentForm.expiryDate}</span>
								</div>
							</div>
						</div>
					{/if}

					<!-- Order Form -->
					<form id="order-form" method="POST" action="?/placeOrder" class="pt-6 border-t" use:enhance={async () => {
							// Show processing toast with longer duration
							const processingToast = toast.loading('Processing your order...', { duration: 60000 });

							return ({ result }) => {
								// Dismiss the processing toast
								toast.dismiss(processingToast);

								console.log('Form submission result:', result);

								if (result.type === 'success') {
									const orderId = result.data?.orderId;
									console.log('Order ID from result:', orderId);

									if (orderId) {
										// Show success message
										toast.success('Order placed successfully!', { duration: 3000 });

										// Reset checkout store
										checkoutStore.reset();

										// Check if user is logged in
										const user = $userStore;

										if (user) {
											// For logged-in users, redirect to the full order confirmation page
											// This page is protected and will verify the user has access to this order
											window.location.href = `/orders/confirmation/${orderId}`;
										} else {
											// For guest users, redirect to the simple confirmation page
											// This doesn't expose the order ID in the URL
											window.location.href = '/orders/confirmation/simple';
										}
									}
								} else if (result.type === 'failure' && result.data) {
									// Show error message for failure
									const errorMessage = typeof result.data.message === 'string' ? result.data.message : 'Failed to place order';
									toast.error(errorMessage);
								} else {
									// Show generic error message
									toast.error('An error occurred while processing your order');
								}
							};
						}}>
						<!-- Hidden fields for order data -->
						{#if $emailForm.email}
							<input type="hidden" name="email" value={$emailForm.email} />
						{/if}

						{#if $shippingForm.firstName}
							<input type="hidden" name="firstName" value={$shippingForm.firstName} />
							<input type="hidden" name="lastName" value={$shippingForm.lastName} />
							<input type="hidden" name="addressLine1" value={$shippingForm.addressLine1} />
							<input type="hidden" name="addressLine2" value={$shippingForm.addressLine2 || ''} />
							<input type="hidden" name="city" value={$shippingForm.city} />
							<input type="hidden" name="state" value={$shippingForm.state} />
							<input type="hidden" name="postalCode" value={$shippingForm.postalCode} />
							<input type="hidden" name="country" value={$shippingForm.country} />
							<input type="hidden" name="shippingMethod" value={$shippingForm.shippingMethod} />
						{/if}

						{#if $checkoutStore.shippingCost}
							<input type="hidden" name="shippingCost" value={$checkoutStore.shippingCost.toString()} />
						{/if}

						{#if $paymentForm.cardNumber}
							<input type="hidden" name="cardNumber" value={$paymentForm.cardNumber} />
							<input type="hidden" name="cardHolder" value={$paymentForm.cardHolder} />
						{/if}

						{#if $cart}
							<input type="hidden" name="subtotal" value={$cart.subtotal.toString()} />
							<input type="hidden" name="taxAmount" value={($cart.subtotal * 0.08).toString()} />
							<input type="hidden" name="discountAmount" value="0" />
							<input type="hidden" name="cartId" value={$cart.id || 'guest-cart'} />

							<!-- Cart items -->
							{#if data.validOrderItems && data.validOrderItems.length > 0}
								<input
									type="hidden"
									name="items"
									value={JSON.stringify(data.validOrderItems)}
								/>
							{:else}
								<!-- Fallback for when validOrderItems is not available -->
								<input
									type="hidden"
									name="items"
									value={JSON.stringify($cart.items.map(item => ({
										productId: item.variant.product?.id || '',
										variantId: item.variant.id,
										quantity: item.quantity,
										price: item.price,
										unitPrice: item.price,
										productName: item.variant.product?.name || item.variant.name,
										variantName: item.variant.name
									})))}
								/>
							{/if}
						{/if}

						<Button
							type="submit"
							class="w-full relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
							size="lg"
							disabled={!checkout.emailValidated || !checkout.shippingValidated || !checkout.paymentValidated}
						>
							{m.checkout_place_order()}
						</Button>
						<p class="text-center text-xs text-muted-foreground/60 mt-2">
							{m.checkout_secure_transaction()}
						</p>
					</form>

					<!-- Moved Terms Agreement -->
					<div class="text-xs text-muted-foreground/60 text-center space-y-1.5 border-t pt-6">
						<p>{m.cart_terms_agreement()}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
