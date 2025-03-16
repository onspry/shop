<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { registerSchema } from '$lib/schemas/auth';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';

	// Using $props() instead of export let for Svelte 5
	let { data } = $props();

	// Initialize the form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(registerSchema),
		validationMethod: 'auto'
	});

	// Password strength calculation using Svelte 5 derived state
	const passwordStrength = $derived(getPasswordStrength($form?.password || ''));
	const passwordStrengthText = $derived(getPasswordStrengthText(passwordStrength));
	const passwordStrengthColor = $derived(getPasswordStrengthColor(passwordStrength));

	function getPasswordStrength(password: string): number {
		if (!password) return 0;

		let strength = 0;

		// Length check
		if (password.length >= 8) strength += 25;

		// Character type checks
		if (/[A-Z]/.test(password)) strength += 25;
		if (/[a-z]/.test(password)) strength += 25;
		if (/[0-9]/.test(password)) strength += 25;

		return strength;
	}

	function getPasswordStrengthText(strength: number): string {
		if (strength === 0) return 'Enter a password';
		if (strength < 50) return 'Weak';
		if (strength < 100) return 'Medium';
		return 'Strong';
	}

	function getPasswordStrengthColor(strength: number): string {
		if (strength === 0) return 'bg-gray-200';
		if (strength < 50) return 'bg-red-500';
		if (strength < 100) return 'bg-yellow-500';
		return 'bg-green-500';
	}
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Create an account</CardTitle>
			<CardDescription>Fill in your details to create a new account.</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="post" class="space-y-4" use:enhance>
				<div class="grid gap-4 grid-cols-2">
					<div class="grid gap-2">
						<Label for="firstName">First name</Label>
						<Input
							id="firstName"
							name="firstName"
							bind:value={$form.firstName}
							aria-invalid={$errors.firstName ? 'true' : undefined}
							disabled={$submitting}
						/>
						{#if $errors.firstName}
							<p class="text-sm text-destructive">{$errors.firstName}</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<Label for="lastName">Last name</Label>
						<Input
							id="lastName"
							name="lastName"
							bind:value={$form.lastName}
							aria-invalid={$errors.lastName ? 'true' : undefined}
							disabled={$submitting}
						/>
						{#if $errors.lastName}
							<p class="text-sm text-destructive">{$errors.lastName}</p>
						{/if}
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						type="email"
						id="email"
						name="email"
						bind:value={$form.email}
						autocomplete="email"
						aria-invalid={$errors.email ? 'true' : undefined}
						disabled={$submitting}
					/>
					{#if $errors.email}
						<p class="text-sm text-destructive">{$errors.email}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						type="password"
						id="password"
						name="password"
						bind:value={$form.password}
						autocomplete="new-password"
						aria-invalid={$errors.password ? 'true' : undefined}
						disabled={$submitting}
					/>

					<!-- Password strength indicator -->
					{#if $form.password}
						<div class="mt-1">
							<div class="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
								<div
									class="h-full transition-all duration-300 {passwordStrengthColor}"
									style="width: {passwordStrength}%"
								></div>
							</div>
							<p class="text-xs mt-1 text-muted-foreground">
								{passwordStrengthText}
							</p>
						</div>
					{/if}

					{#if $errors.password}
						<p class="text-sm text-destructive">{$errors.password}</p>
					{/if}
				</div>

				{#if $message}
					<div class="text-sm text-destructive">
						{$message}
					</div>
				{/if}

				<Button type="submit" variant="default" class="w-full" disabled={$submitting}>
					{#if $submitting}
						<LoadingSpinner size={16} className="mr-2" />
					{/if}
					Create Account
				</Button>
			</form>
		</CardContent>

		<CardFooter>
			<p class="text-sm text-muted-foreground">
				Already have an account?
				<a href="/auth/login" class="font-medium hover:text-primary ml-1">{m.sign_in()}</a>
			</p>
		</CardFooter>
	</Card>
</div>
