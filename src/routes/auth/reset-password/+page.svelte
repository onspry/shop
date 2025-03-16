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

	let { form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);
	let password = $state('');
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
					<Label for="password">{m.reset_password_new_password_label()}</Label>
					<Input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						placeholder={m.reset_password_new_password_label()}
						autocomplete="new-password"
					/>
					{#if form?.message}
						<p class="text-sm text-destructive">{form.message}</p>
					{/if}
				</div>

				<Button type="submit" variant="default" class="w-full" disabled={isLoading || !password}>
					{#if isLoading}
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
