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
	import { countries, addressStructures } from '$lib/config/address-structures';
	import { browser } from '$app/environment';

	const DEFAULT_COUNTRY = 'US';
	const DEFAULT_SHIPPING_METHOD = 'standard';

	const { onContinue, onShippingCostUpdate } = $props<{
		onContinue: (address: {
			firstName: string;
			lastName: string;
			addressLine1: string;
			addressLine2?: string;
			city: string;
			state?: string;
			postalCode: string;
			country: string;
		}) => void;
		onShippingCostUpdate: (cost: number, estimatedDays: string) => void;
	}>();

	let currentCountry = $state(DEFAULT_COUNTRY);
	let selectedShippingMethod = $state(DEFAULT_SHIPPING_METHOD);
	let formData = $state({
		firstName: '',
		lastName: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		state: '',
		postalCode: '',
		country: DEFAULT_COUNTRY,
		shippingMethod: DEFAULT_SHIPPING_METHOD
	});

	const addressStructure = $derived(addressStructures[currentCountry] || addressStructures.DEFAULT);

	$effect(() => {
		formData.country = currentCountry;
	});

	function handleCountryChange(newCountry: string) {
		currentCountry = newCountry;
	}

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

	function handleShippingMethodChange(method: string) {
		selectedShippingMethod = method;
		const selectedMethod = shippingMethods.find((sm) => sm.id === method);
		if (selectedMethod) {
			onShippingCostUpdate(selectedMethod.price, selectedMethod.estimatedDays);
		}
	}

	$effect(() => {
		const method = shippingMethods.find((sm) => sm.id === selectedShippingMethod);
		if (method) {
			onShippingCostUpdate(method.price, method.estimatedDays);
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		onContinue(formData);
	}
</script>

<form class="space-y-8" onsubmit={handleSubmit}>
	<!-- Country Selection -->
	<div class="grid gap-2">
		<Label for="country">{m.country()}</Label>
		{#if browser}
			<Select type="single" value={currentCountry} onValueChange={handleCountryChange}>
				<SelectTrigger class="w-full">
					{countries.find((c) => c.value === currentCountry)?.label || m.country_us()}
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
			<Input type="text" id="country" name="country" value={currentCountry} readonly />
		{/if}
	</div>

	<!-- Form Fields -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="grid gap-2">
			<Label for="firstName">{m.checkout_first_name()}</Label>
			<Input type="text" id="firstName" name="firstName" bind:value={formData.firstName} />
		</div>

		<div class="grid gap-2">
			<Label for="lastName">{m.checkout_last_name()}</Label>
			<Input type="text" id="lastName" name="lastName" bind:value={formData.lastName} />
		</div>

		<div class="grid gap-2 md:col-span-2">
			<Label for="addressLine1">{addressStructure.labels.addressLine1}</Label>
			<Input
				type="text"
				id="addressLine1"
				name="addressLine1"
				bind:value={formData.addressLine1}
				placeholder={addressStructure.placeholders.addressLine1}
			/>
		</div>

		<div class="grid gap-2 md:col-span-2">
			<Label for="addressLine2">{addressStructure.labels.addressLine2}</Label>
			<Input
				type="text"
				id="addressLine2"
				name="addressLine2"
				bind:value={formData.addressLine2}
				placeholder={addressStructure.placeholders.addressLine2}
			/>
		</div>

		<div class="grid gap-2">
			<Label for="city">{addressStructure.labels.city}</Label>
			<Input
				type="text"
				id="city"
				name="city"
				bind:value={formData.city}
				placeholder={addressStructure.placeholders.city}
			/>
		</div>

		{#if addressStructure.fields.includes('state')}
			<div class="grid gap-2">
				<Label for="state">{addressStructure.labels.state}</Label>
				<Input
					type="text"
					id="state"
					name="state"
					bind:value={formData.state}
					placeholder={addressStructure.placeholders.state}
				/>
			</div>
		{/if}

		<div class="grid gap-2">
			<Label for="postalCode">{addressStructure.labels.postalCode}</Label>
			<Input
				type="text"
				id="postalCode"
				name="postalCode"
				bind:value={formData.postalCode}
				placeholder={addressStructure.placeholders.postalCode}
			/>
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
					onclick={() => handleShippingMethodChange(method.id)}
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

	<Button type="submit" class="w-full">
		{m.checkout_continue_to_payment()}
		<ArrowRight class="ml-2" size={16} />
	</Button>
</form>
