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
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import type { z } from 'zod';
	import type { SuperForm, ValidationErrors } from 'sveltekit-superforms';
	import type { shippingSchema } from '$lib/schemas/shipping';
	import {
		countries,
		addressStructures,
		type AddressStructure
	} from '$lib/config/address-structures';
	import { browser } from '$app/environment';

	type ShippingFormType = z.infer<typeof shippingSchema>;

	const { form, isAuthenticated, userEmail, guestEmail, onContinue, onShippingCostUpdate, errors } =
		$props<{
			form: SuperForm<ShippingFormType>;
			isAuthenticated: boolean;
			userEmail: string;
			guestEmail: string;
			onContinue: () => void;
			onShippingCostUpdate: (cost: number, estimatedDays: string) => void;
			errors: ValidationErrors<ShippingFormType>;
		}>();

	let formData = $state(form.data);

	// Sync form data with the parent form
	$effect(() => {
		Object.assign(form.data, formData);
	});

	let selectedShippingMethod = $state('standard');

	const shippingMethods = [
		{
			id: 'standard',
			name: m.shipping_standard(),
			price: 5.99,
			description: m.shipping_standard_desc(),
			estimatedDays: '3-5'
		},
		{
			id: 'express',
			name: m.shipping_express(),
			price: 14.99,
			description: m.shipping_express_desc(),
			estimatedDays: '1-2'
		},
		{
			id: 'overnight',
			name: m.shipping_overnight(),
			price: 29.99,
			description: m.shipping_overnight_desc(),
			estimatedDays: '1'
		}
	];

	let selectedMethod = $derived(
		shippingMethods.find((method) => method.id === selectedShippingMethod)
	);

	// Update parent with shipping cost changes
	$effect(() => {
		if (selectedMethod) {
			onShippingCostUpdate(selectedMethod.price, selectedMethod.estimatedDays);
		}
	});

	let selectedCountry = $state('US');
	let addressStructure = $derived(addressStructures[selectedCountry] || addressStructures.DEFAULT);

	// Sync selectedCountry with form data
	$effect(() => {
		selectedCountry = formData.country;
	});

	// Update form data when selectedCountry changes
	$effect(() => {
		formData.country = selectedCountry;
	});

	type RegionField = 'state' | 'county' | 'prefecture';

	// Function to validate postal code
	function validatePostalCode(value: string): string | null {
		if (!value) return null;
		const validation = addressStructure.validation?.postalCode;
		if (!validation) return null;

		const isValid = validation.pattern.test(value);
		return isValid ? null : validation.message;
	}

	// Helper function to get the region field name based on country
	function getRegionFieldName(fields: string[]): RegionField {
		return (
			(fields.find((f) => f === 'state' || f === 'county' || f === 'prefecture') as RegionField) ||
			'state'
		);
	}

	// Derived state for shipping form validation
	let isShippingValid = $derived(() => {
		const requiredFields = addressStructure.fields;
		const baseValidation = requiredFields.every((field) => formData[field]?.trim());

		// Add postal code validation
		const postalCodeValidation = !validatePostalCode(formData.postalCode);

		return baseValidation && postalCodeValidation;
	});

	function handleContinue() {
		if (isShippingValid()) {
			onContinue();
		}
	}

	const triggerContent = $derived(
		countries.find((c) => c.value === formData.country)?.label ?? 'Select a country'
	);
</script>

<form
	class="space-y-8"
	aria-label={m.checkout_delivery_address()}
	onsubmit={(e) => {
		e.preventDefault();
		handleContinue();
	}}
>
	<!-- Shipping Address -->
	<div class="space-y-6">
		<h3 class="text-lg font-medium">{m.checkout_delivery_address()}</h3>

		<!-- Country Selection - Full Width -->
		<div class="grid gap-2">
			<Label for="country">{m.country()}</Label>
			{#if browser}
				<Select type="single" bind:value={selectedCountry}>
					<SelectTrigger class="w-full" aria-invalid={errors?.country?.[0] ? 'true' : undefined}>
						{triggerContent}
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{#each countries as country}
								<SelectItem value={country.value}>{country.label}</SelectItem>
							{/each}
						</SelectGroup>
					</SelectContent>
				</Select>
			{:else}
				<Input
					type="text"
					id="country"
					name="country"
					bind:value={selectedCountry}
					readonly
					aria-invalid={errors?.country?.[0] ? 'true' : undefined}
				/>
			{/if}
			{#if errors?.country?.[0]}
				<p class="text-sm text-destructive">{errors.country[0]}</p>
			{/if}
		</div>

		<!-- Dynamic Address Fields in Grid Layout -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each addressStructure.fields as field}
				{#if field === 'firstName' || field === 'lastName'}
					<div class="grid gap-2">
						<Label for={field}
							>{field === 'firstName' ? m.checkout_first_name() : m.checkout_last_name()}</Label
						>
						<Input
							type="text"
							id={field}
							name={field}
							bind:value={formData[field]}
							required
							aria-invalid={errors?.[field]?.[0] ? 'true' : undefined}
						/>
						{#if errors?.[field]?.[0]}
							<p class="text-sm text-destructive">{errors[field][0]}</p>
						{/if}
					</div>
				{:else if field === 'addressLine1'}
					<div class="grid gap-2 md:col-span-2">
						<Label for={field}>{addressStructure.labels[field]}</Label>
						<Input
							type="text"
							id={field}
							name={field}
							bind:value={formData[field]}
							placeholder={addressStructure.placeholders[field]}
							required
							aria-invalid={errors?.[field]?.[0] ? 'true' : undefined}
						/>
						{#if errors?.[field]?.[0]}
							<p class="text-sm text-destructive">{errors[field][0]}</p>
						{/if}
					</div>
				{:else if field === 'addressLine2'}
					<div class="grid gap-2 md:col-span-2">
						<Label for={field}>{addressStructure.labels[field]}</Label>
						<Input
							type="text"
							id={field}
							name={field}
							bind:value={formData[field]}
							placeholder={addressStructure.placeholders[field]}
							aria-invalid={errors?.[field]?.[0] ? 'true' : undefined}
						/>
						{#if errors?.[field]?.[0]}
							<p class="text-sm text-destructive">{errors[field][0]}</p>
						{/if}
					</div>
				{:else if field === 'city'}
					<div class="grid gap-2 md:col-span-2">
						<div class="grid md:grid-cols-6 gap-4">
							<!-- City -->
							<div class="grid gap-2 md:col-span-2">
								<Label for="city">{addressStructure.labels.city}</Label>
								<Input
									type="text"
									id="city"
									name="city"
									bind:value={formData.city}
									placeholder={addressStructure.placeholders.city}
									required
									aria-invalid={errors?.city?.[0] ? 'true' : undefined}
								/>
								{#if errors?.city?.[0]}
									<p class="text-sm text-destructive">{errors.city[0]}</p>
								{/if}
							</div>

							<!-- State/Region -->
							{#if addressStructure.fields.includes('state') || addressStructure.fields.includes('county') || addressStructure.fields.includes('prefecture')}
								<div class="grid gap-2 md:col-span-2">
									<Label for="region"
										>{addressStructure.labels[
											getRegionFieldName(
												addressStructure.fields
											) as keyof typeof addressStructure.labels
										]}</Label
									>
									<Input
										type="text"
										id="region"
										name={getRegionFieldName(addressStructure.fields)}
										bind:value={formData[getRegionFieldName(addressStructure.fields)]}
										placeholder={addressStructure.placeholders[
											getRegionFieldName(
												addressStructure.fields
											) as keyof typeof addressStructure.placeholders
										]}
										required
										aria-invalid={errors?.[getRegionFieldName(addressStructure.fields)]?.[0]
											? 'true'
											: undefined}
									/>
									{#if errors?.[getRegionFieldName(addressStructure.fields)]?.[0]}
										<p class="text-sm text-destructive">
											{errors[getRegionFieldName(addressStructure.fields)][0]}
										</p>
									{/if}
								</div>
							{/if}

							<!-- Postal Code -->
							<div class="grid gap-2 md:col-span-2">
								<Label for="postalCode">{addressStructure.labels.postalCode}</Label>
								<Input
									type="text"
									id="postalCode"
									name="postalCode"
									bind:value={formData.postalCode}
									placeholder={addressStructure.placeholders.postalCode}
									pattern={addressStructure.validation.postalCode.pattern.source}
									title={addressStructure.validation.postalCode.message}
									required
									aria-invalid={errors?.postalCode?.[0] ? 'true' : undefined}
								/>
								{#if errors?.postalCode?.[0]}
									<p class="text-sm text-destructive">{errors.postalCode[0]}</p>
								{:else if formData.postalCode && validatePostalCode(formData.postalCode)}
									<p class="text-sm text-destructive">{validatePostalCode(formData.postalCode)}</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Shipping Method -->
	<div class="space-y-6">
		<h3 class="text-lg font-medium">{m.checkout_shipping_method()}</h3>
		<div class="space-y-4" role="radiogroup" aria-label={m.checkout_shipping_method()}>
			{#each shippingMethods as method}
				<button
					type="button"
					role="radio"
					aria-checked={selectedShippingMethod === method.id}
					class={`w-full text-left flex items-start gap-4 p-4 rounded-lg bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors ${selectedShippingMethod === method.id ? 'ring-1 ring-primary' : ''}`}
					onclick={() => (selectedShippingMethod = method.id)}
					onkeydown={(e) => e.key === 'Enter' && (selectedShippingMethod = method.id)}
				>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<div
								class="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center"
							>
								{#if selectedShippingMethod === method.id}
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

	<Button type="submit" class="w-full" disabled={!isShippingValid}>
		{m.checkout_continue_to_payment()}
		<ArrowRight class="ml-2" size={16} />
	</Button>
</form>
