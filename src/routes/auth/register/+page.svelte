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
	import PasswordStrengthIndicator from '$lib/components/password-strength-indicator.svelte';

	// Using $props() instead of export let for Svelte 5
	let { data } = $props();

	// Initialize the form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(registerSchema),
		validationMethod: 'auto'
	});
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
					<PasswordStrengthIndicator password={$form.password} />

					{#if $errors.password}
						<p class="text-sm text-destructive">{$errors.password}</p>
					{/if}
				</div>

				{#if $message}
					<div class="text-sm text-destructive">
						{#if typeof $message === 'string'}
							{$message}
						{:else if typeof $message === 'object'}
							{#each Object.entries($message) as [field, error]}
								<p>{error}</p>
							{/each}
						{:else}
							An error occurred during registration
						{/if}
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
