<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { passwordResetSchema } from '$lib/schemas/auth';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
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
		validators: zod(passwordResetSchema),
		validationMethod: 'auto'
	});
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>{m.auth_forgot_password_title()}</CardTitle>
			<CardDescription>{m.auth_forgot_password_description()}</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="POST" class="space-y-4" use:enhance>
				<div class="grid gap-2">
					<Label for="email">{m.auth_forgot_password_email_placeholder()}</Label>
					<Input
						id="email"
						name="email"
						type="email"
						bind:value={$form.email}
						autocomplete="email"
						aria-invalid={$errors.email ? 'true' : undefined}
						disabled={$submitting}
					/>
					{#if $errors.email}
						<p class="text-sm text-destructive">{$errors.email}</p>
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
							An error occurred
						{/if}
					</div>
				{/if}

				<Button type="submit" variant="default" class="w-full" disabled={$submitting}>
					{#if $submitting}
						<LoadingSpinner size={16} className="mr-2" />
					{/if}
					{m.auth_forgot_password_submit()}
				</Button>
			</form>
		</CardContent>

		<CardFooter>
			<p class="text-sm text-muted-foreground">
				{m.auth_forgot_password_remember()}
				<a href="/auth/login" class="font-medium hover:text-primary ml-1">
					{m.auth_forgot_password_login()}
				</a>
			</p>
		</CardFooter>
	</Card>
</div>
