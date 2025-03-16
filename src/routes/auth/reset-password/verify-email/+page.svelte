<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';
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

	let { data, form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);
	let code = $state('');
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
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<div class="grid gap-2">
					<Label for="code">{m.verify_email_code_label()}</Label>
					<Input
						id="code"
						name="code"
						type="text"
						required
						bind:value={code}
						placeholder="2DZEK3LV"
						autocomplete="one-time-code"
						inputmode="text"
					/>
					{#if form?.message}
						<p class="text-sm text-destructive">{form.message}</p>
					{/if}
				</div>

				<Button type="submit" variant="default" class="w-full" disabled={isLoading || !code}>
					{#if isLoading}
						<LoadingSpinner size={16} className="mr-2" />
					{/if}
					{m.verify_email_verify_button()}
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex justify-center">
			<a href="/auth/forgot-password" class="text-sm text-muted-foreground hover:text-primary">
				Try again with a different email
			</a>
		</CardFooter>
	</Card>
</div>
