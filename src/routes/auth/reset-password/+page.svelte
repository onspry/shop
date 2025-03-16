<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { passwordUpdateSchema } from '$lib/schemas/auth';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import PasswordStrengthIndicator from '$lib/components/password-strength-indicator.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
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

	// Using $props() instead of export let for Svelte 5
	let { data } = $props();

	// Initialize the form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(passwordUpdateSchema),
		validationMethod: 'auto'
	});

	// Handle password input changes
	function handlePasswordInput(value: string) {
		$form.password = value;
	}

	// Handle confirm password input changes
	function handleConfirmPasswordInput(value: string) {
		$form.confirmPassword = value;
	}
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>{m.reset_password_title()}</CardTitle>
			<CardDescription>{m.reset_password_description()}</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="POST" class="space-y-4" use:enhance>
				<div class="grid gap-2">
					<Label for="password">{m.reset_password_new_password_label()}</Label>
					<PasswordInput
						id="password"
						name="password"
						value={$form.password}
						oninput={handlePasswordInput}
						placeholder={m.reset_password_new_password_label()}
						autocomplete="new-password"
						ariaInvalid={$errors.password ? 'true' : undefined}
						disabled={$submitting}
					/>

					<!-- Password strength indicator -->
					<PasswordStrengthIndicator password={$form.password} />

					{#if $errors.password}
						<p class="text-sm text-destructive">{$errors.password}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="confirmPassword">{m.reset_password_confirm_password_label()}</Label>
					<PasswordInput
						id="confirmPassword"
						name="confirmPassword"
						value={$form.confirmPassword}
						oninput={handleConfirmPasswordInput}
						placeholder={m.reset_password_confirm_password_label()}
						autocomplete="new-password"
						ariaInvalid={$errors.confirmPassword ? 'true' : undefined}
						disabled={$submitting}
					/>
					{#if $errors.confirmPassword}
						<p class="text-sm text-destructive">{$errors.confirmPassword}</p>
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
					{m.reset_password_submit()}
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex justify-center">
			<a href="/auth/login" class="text-sm text-muted-foreground hover:text-primary">
				Back to login
			</a>
		</CardFooter>
	</Card>
</div>
