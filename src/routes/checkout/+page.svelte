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
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import { ShoppingBag, User, Truck, ImageOff, Mail, MapPin } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { countries, addressStructures } from '$lib/config/address-structures';
	import { checkoutStore } from '$lib/stores/checkout';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';

	// Page data props
	const { data } = $props<{ data: PageData }>();

	// Image handling state
	let imageStates = $state(new Map<string, { error: boolean; loaded: boolean }>());

	// Initialize forms with proper types
	const {
		form: emailForm,
		errors: emailErrors,
		validate: validateEmail,
		constraints: emailConstraints,
		validateForm: validateEmailForm
	} = superForm(data.emailForm, {
		validators: zod(emailSchema),
		validationMethod: 'oninput'
	});

	const {
		form: shippingForm,
		errors: shippingErrors,
		validate: validateShipping,
		constraints: shippingConstraints,
		validateForm: validateShippingForm,
		options: shippingOptions
	} = superForm(data.shippingForm, {
		validators: zod(shippingSchema),
		validationMethod: 'oninput'
	});

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
		// User data
		email: $emailForm.email,
		// Shipping config
		country: $shippingForm.country,
		shippingMethod: $shippingForm.shippingMethod,
		// Shipping details for display
		shippingCost: $checkoutStore.shippingCost,
		estimatedDays: $checkoutStore.estimatedDays,
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
		shipping: Object.values($shippingErrors).some((error) => error !== undefined && error !== null)
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

	// Handle place order
	async function placeOrder() {
		// 1. Validate Email and Shipping again before placing order
		const emailValid = await validateEmailForm();
		const shippingValid = await validateShippingForm();

		if (!emailValid.valid) {
			showValidationFeedback('Please correct the errors in the email section.');
			window.scrollTo(0, 0);
			return;
		}
		if (!shippingValid.valid) {
			showValidationFeedback('Please correct the errors in the shipping section.');
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
		<div class="lg:col-span-8">
			<!-- Email Section -->
			<div class="mb-8">
				<div class="flex items-center justify-between w-full mb-4">
					<h2 class="text-2xl font-semibold flex items-center gap-2">
						<Mail class="h-5 w-5" />
						{m.checkout_tab_email()}
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
									oninput={async (e) => {
										checkoutStore.setEmail(e.currentTarget.value);
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

			<!-- Shipping Section -->
			<div>
				<div class="flex items-center justify-between w-full mb-4">
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

				<div class="space-y-6">
					<!-- Country Selection -->
					<div class="input-wrapper">
						<Label for="country">{m.country()}</Label>
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
							<Input type="text" name="country" value={$shippingForm.country} readonly />
						{/if}
						{#if $shippingErrors.country}
							<p class="error-message">{$shippingErrors.country[0]}</p>
						{/if}
					</div>

					<!-- Name Fields -->
					<div class="form-row form-row-2">
						<div class="input-wrapper">
							<Label for="firstName">{m.checkout_first_name()}</Label>
							<Input
								type="text"
								name="firstName"
								bind:value={$shippingForm.firstName}
								oninput={async () => {
									checkoutStore.updateShippingConfig({
										firstName: $shippingForm.firstName
									});
									await validateShipping('firstName');
								}}
							/>
							{#if $shippingErrors.firstName}
								<p class="error-message">{$shippingErrors.firstName[0]}</p>
							{/if}
						</div>

						<div class="input-wrapper">
							<Label for="lastName">{m.checkout_last_name()}</Label>
							<Input
								type="text"
								name="lastName"
								bind:value={$shippingForm.lastName}
								oninput={async () => {
									checkoutStore.updateShippingConfig({
										lastName: $shippingForm.lastName
									});
									await validateShipping('lastName');
								}}
							/>
							{#if $shippingErrors.lastName}
								<p class="error-message">{$shippingErrors.lastName[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Address Fields -->
					<div class="input-wrapper">
						<Label for="addressLine1">{checkout.addressStructure.labels.addressLine1}</Label>
						<Input
							type="text"
							name="addressLine1"
							bind:value={$shippingForm.addressLine1}
							placeholder={checkout.addressStructure.placeholders.addressLine1}
							oninput={async () => {
								checkoutStore.updateShippingConfig({
									addressLine1: $shippingForm.addressLine1
								});
								await validateShipping('addressLine1');
							}}
						/>
						{#if $shippingErrors.addressLine1}
							<p class="error-message">{$shippingErrors.addressLine1[0]}</p>
						{/if}
					</div>

					<div class="input-wrapper">
						<Label for="addressLine2">{checkout.addressStructure.labels.addressLine2}</Label>
						<Input
							type="text"
							name="addressLine2"
							bind:value={$shippingForm.addressLine2}
							placeholder={checkout.addressStructure.placeholders.addressLine2}
							oninput={(e) => {
								checkoutStore.updateShippingConfig({
									addressLine2: e.currentTarget.value || ''
								});
							}}
						/>
					</div>

					<!-- City, State, ZIP -->
					<div class="form-row form-row-3">
						<div class="input-wrapper">
							<Label for="city">{checkout.addressStructure.labels.city}</Label>
							<Input
								type="text"
								name="city"
								bind:value={$shippingForm.city}
								placeholder={checkout.addressStructure.placeholders.city}
								oninput={async () => {
									checkoutStore.updateShippingConfig({
										city: $shippingForm.city
									});
									await validateShipping('city');
								}}
							/>
							{#if $shippingErrors.city}
								<p class="error-message">{$shippingErrors.city[0]}</p>
							{/if}
						</div>

						{#if checkout.addressStructure.fields.includes('state') || checkout.addressStructure.fields.includes('prefecture') || checkout.addressStructure.fields.includes('province') || checkout.addressStructure.fields.includes('county')}
							<div class="input-wrapper">
								<Label for="state">
									{checkout.addressStructure.labels.state ||
										checkout.addressStructure.labels.prefecture ||
										checkout.addressStructure.labels.province ||
										checkout.addressStructure.labels.county}
								</Label>
								<Input
									type="text"
									name="state"
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
								{#if $shippingErrors.state}
									<p class="error-message">{$shippingErrors.state[0]}</p>
								{/if}
							</div>
						{/if}

						<div class="input-wrapper">
							<Label for="postalCode">{checkout.addressStructure.labels.postalCode}</Label>
							<Input
								type="text"
								name="postalCode"
								bind:value={$shippingForm.postalCode}
								placeholder={checkout.addressStructure.placeholders.postalCode}
								oninput={async () => {
									checkoutStore.updateShippingConfig({
										postalCode: $shippingForm.postalCode
									});
									await validateShipping('postalCode');
								}}
							/>
							{#if $shippingErrors.postalCode}
								<p class="error-message">{$shippingErrors.postalCode[0]}</p>
							{/if}
						</div>
					</div>

					<!-- Shipping Method -->
					<div class="mt-6">
						<h3 class="text-lg font-medium mb-3">{m.checkout_shipping_method()}</h3>
						<input type="hidden" name="shippingMethod" bind:value={$shippingForm.shippingMethod} />
						<div class="space-y-2" role="radiogroup" aria-label={m.checkout_shipping_method()}>
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

		<!-- Order summary -->
		<div class="lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit">
			<div class="flex items-center justify-between w-full mb-4">
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

				<!-- Estimated delivery -->
				{#if checkout.shippingValidated && checkout.shippingAddress}
					<div class="border-t pt-6">
						<div class="flex items-center gap-2 text-base mb-4">
							<Truck class="h-5 w-5" />
							<span class="font-medium">{m.checkout_estimated_delivery()}</span>
						</div>
						<p class="text-base mb-6">
							{checkout.estimatedDays}
							{m.shipping_business_days()}
						</p>
						<div class="space-y-1">
							<p class="font-medium text-muted-foreground mb-3">
								{m.checkout_delivery_address()}
							</p>
							<div class="bg-muted/5 p-4 rounded-lg space-y-1 font-medium">
								<p class="uppercase">
									{checkout.shippingAddress.firstName}
									{checkout.shippingAddress.lastName}
								</p>
								<p>{checkout.shippingAddress.addressLine1}</p>
								{#if checkout.shippingAddress.addressLine2}
									<p>{checkout.shippingAddress.addressLine2}</p>
								{/if}
								<p>
									{checkout.shippingAddress.city}{#if checkout.shippingAddress.state}, {checkout
											.shippingAddress.state}{/if}
									{checkout.shippingAddress.postalCode}
								</p>
								<p class="uppercase">
									{countries.find((c) => c.value === checkout.shippingAddress!.country)?.label ||
										checkout.shippingAddress!.country}
								</p>
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
						disabled={!checkout.emailValidated || !checkout.shippingValidated}
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
