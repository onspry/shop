<script lang="ts">
	import { enhance } from '$app/forms';
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

	let isLoading = $state(false);
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
					<Label for="email">{m.auth_forgot_password_email_placeholder()}</Label>
					<Input id="email" name="email" type="email" required autocomplete="email" />
				</div>

				<Button type="submit" variant="default" class="w-full" disabled={isLoading}>
					{#if isLoading}
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
