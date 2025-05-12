<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { verificationCodeSchema } from '$lib/schemas/auth';
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
	import { localizeHref } from '$lib/paraglide/runtime';

	// Using $props() instead of export let for Svelte 5
	let { data } = $props();

	// Initialize the form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(verificationCodeSchema),
		validationMethod: 'auto'
	});
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>{m.verify_email_title()}</CardTitle>
			<CardDescription>{m.verify_email_description({ email: data.email })}</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="POST" class="space-y-4" use:enhance>
				<div class="grid gap-2">
					<Label for="code">{m.verify_email_code_label()}</Label>
					<Input
						id="code"
						name="code"
						type="text"
						bind:value={$form.code}
						placeholder="2DZEK3LV"
						autocomplete="one-time-code"
						inputmode="text"
						aria-invalid={$errors.code ? 'true' : undefined}
						disabled={$submitting}
					/>
					{#if $errors.code}
						<p class="text-sm text-destructive">{$errors.code}</p>
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

				<Button
					type="submit"
					variant="default"
					class="w-full"
					disabled={$submitting || !$form.code}
				>
					{#if $submitting}
						<LoadingSpinner size={16} className="mr-2" />
					{/if}
					{m.verify_email_verify_button()}
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex justify-center">
			<div class="text-center mt-4">
				<a
					href={localizeHref('/auth/forgot-password')}
					class="text-sm text-muted-foreground hover:text-primary"
				>
					{m.auth_forgot_password_try_again()}
				</a>
			</div>
		</CardFooter>
	</Card>
</div>
