<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { formatPrice } from '$lib/utils/price';
	import type { z } from 'zod';
	import type { SuperForm, ValidationErrors } from 'sveltekit-superforms';
	import type { shippingSchema } from '$lib/schemas/shipping';

	type ShippingFormType = z.infer<typeof shippingSchema>;

	const { form, isAuthenticated, userEmail, guestEmail, onContinue, onShippingCostUpdate, errors } =
		$props<{
			form: ShippingFormType;
			isAuthenticated: boolean;
			userEmail: string;
			guestEmail: string;
			onContinue: () => void;
			onShippingCostUpdate: (cost: number, estimatedDays: string) => void;
			errors: ValidationErrors<ShippingFormType>;
		}>();

	let formData = $state({ ...form });

	// Update parent form when our local form changes
	$effect(() => {
		Object.assign(form, formData);
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

	// Derived state for shipping form validation
	let isShippingValid = $derived(
		formData.firstName?.trim() &&
			formData.lastName?.trim() &&
			formData.addressLine1?.trim() &&
			formData.city?.trim() &&
			formData.state?.trim() &&
			formData.postalCode?.trim() &&
			formData.country?.trim()
	);

	function handleContinue() {
		if (isShippingValid) {
			onContinue();
		}
	}
</script>

<div class="space-y-8">
	<!-- Shipping Address -->
	<div class="space-y-6">
		<h3 class="text-lg font-medium">{m.checkout_delivery_address()}</h3>
		<div class="grid gap-6">
			<div class="grid grid-cols-2 gap-6">
				<div class="grid gap-2">
					<Label for="firstName">{m.checkout_first_name()}</Label>
					<Input
						id="firstName"
						bind:value={formData.firstName}
						placeholder="John"
						required
						class="bg-muted/5 border-0 focus-visible:ring-1"
						aria-invalid={errors?.firstName?.[0] ? 'true' : undefined}
					/>
					{#if errors?.firstName?.[0]}
						<p class="text-sm text-destructive">{errors.firstName[0]}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="lastName">{m.checkout_last_name()}</Label>
					<Input
						id="lastName"
						bind:value={formData.lastName}
						placeholder="Doe"
						required
						class="bg-muted/5 border-0 focus-visible:ring-1"
						aria-invalid={errors?.lastName?.[0] ? 'true' : undefined}
					/>
					{#if errors?.lastName?.[0]}
						<p class="text-sm text-destructive">{errors.lastName[0]}</p>
					{/if}
				</div>
			</div>
			<div class="grid gap-2">
				<Label for="addressLine1">{m.checkout_address()}</Label>
				<Input
					id="addressLine1"
					bind:value={formData.addressLine1}
					placeholder="123 Main St"
					required
					class="bg-muted/5 border-0 focus-visible:ring-1"
					aria-invalid={errors?.addressLine1?.[0] ? 'true' : undefined}
				/>
				{#if errors?.addressLine1?.[0]}
					<p class="text-sm text-destructive">{errors.addressLine1[0]}</p>
				{/if}
			</div>
			<div class="grid gap-2">
				<Label for="addressLine2">{m.checkout_apartment()}</Label>
				<Input
					id="addressLine2"
					bind:value={formData.addressLine2}
					placeholder="Apt 4B"
					class="bg-muted/5 border-0 focus-visible:ring-1"
				/>
			</div>
			<div class="grid grid-cols-3 gap-6">
				<div class="grid gap-2">
					<Label for="city">{m.checkout_city()}</Label>
					<Input
						id="city"
						bind:value={formData.city}
						placeholder="New York"
						required
						class="bg-muted/5 border-0 focus-visible:ring-1"
						aria-invalid={errors?.city?.[0] ? 'true' : undefined}
					/>
					{#if errors?.city?.[0]}
						<p class="text-sm text-destructive">{errors.city[0]}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="state">{m.checkout_state()}</Label>
					<Input
						id="state"
						bind:value={formData.state}
						placeholder="NY"
						required
						class="bg-muted/5 border-0 focus-visible:ring-1"
						aria-invalid={errors?.state?.[0] ? 'true' : undefined}
					/>
					{#if errors?.state?.[0]}
						<p class="text-sm text-destructive">{errors.state[0]}</p>
					{/if}
				</div>
				<div class="grid gap-2">
					<Label for="postalCode">{m.checkout_zip()}</Label>
					<Input
						id="postalCode"
						bind:value={formData.postalCode}
						placeholder="10001"
						required
						class="bg-muted/5 border-0 focus-visible:ring-1"
						aria-invalid={errors?.postalCode?.[0] ? 'true' : undefined}
					/>
					{#if errors?.postalCode?.[0]}
						<p class="text-sm text-destructive">{errors.postalCode[0]}</p>
					{/if}
				</div>
			</div>
			<div class="grid gap-2">
				<Label for="country">{m.country()}</Label>
				<Input
					id="country"
					bind:value={formData.country}
					placeholder="United States"
					required
					class="bg-muted/5 border-0 focus-visible:ring-1"
					aria-invalid={errors?.country?.[0] ? 'true' : undefined}
				/>
				{#if errors?.country?.[0]}
					<p class="text-sm text-destructive">{errors.country[0]}</p>
				{/if}
			</div>
			<div class="grid gap-2">
				<Label for="phone">{m.checkout_phone()}</Label>
				<Input
					id="phone"
					type="tel"
					bind:value={formData.phone}
					placeholder="(555) 555-5555"
					class="bg-muted/5 border-0 focus-visible:ring-1"
					aria-invalid={errors?.phone?.[0] ? 'true' : undefined}
				/>
				{#if errors?.phone?.[0]}
					<p class="text-sm text-destructive">{errors.phone[0]}</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Shipping Method -->
	<div class="space-y-6">
		<h3 class="text-lg font-medium">{m.checkout_shipping_method()}</h3>
		<div class="space-y-4">
			{#each shippingMethods as method}
				<button
					type="button"
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

	<Button type="button" class="w-full" onclick={handleContinue} disabled={!isShippingValid}>
		{m.checkout_continue_to_payment()}
		<ArrowRight class="ml-2" size={16} />
	</Button>
</div>
