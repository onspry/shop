<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
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
	import { goto } from '$app/navigation';

	interface ActionData {
		email?: string;
		firstName?: string;
		lastName?: string;
		message?: string;
	}

	let { form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);

	const handleSubmit: SubmitFunction = () => {
		isLoading = true;
		return async ({ result, update }) => {
			if (result.type === 'error' || result.type === 'failure') {
				isLoading = false;
				await update();
			} else if (result.type === 'redirect') {
				await goto(result.location);
			}
		};
	};
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Create an account</CardTitle>
			<CardDescription>
				Username must be 4-31 characters and password must be at least 8 characters.
			</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="post" class="space-y-4" use:enhance={handleSubmit}>
				<div class="grid gap-4 grid-cols-2">
					<div class="grid gap-2">
						<Label for="form-signup.firstName">First name</Label>
						<Input
							id="form-signup.firstName"
							name="firstName"
							required
							value={form?.firstName ?? ''}
							disabled={isLoading}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="form-signup.lastName">Last name</Label>
						<Input
							id="form-signup.lastName"
							name="lastName"
							required
							value={form?.lastName ?? ''}
							disabled={isLoading}
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="form-signup.email">Email</Label>
					<Input
						type="email"
						id="form-signup.email"
						name="email"
						autocomplete="email"
						required
						value={form?.email ?? ''}
						disabled={isLoading}
					/>
				</div>

				<div class="grid gap-2">
					<Label for="form-signup.password">Password</Label>
					<Input
						type="password"
						id="form-signup.password"
						name="password"
						autocomplete="new-password"
						required
						disabled={isLoading}
					/>
				</div>

				{#if form?.message}
					<div class="text-sm text-destructive">
						{form.message}
					</div>
				{/if}

				<Button type="submit" variant="default" class="w-full" disabled={isLoading}>
					{#if isLoading}
						<LoadingSpinner size={16} className="mr-2" />
					{/if}
					Create Account
				</Button>
			</form>
		</CardContent>

		<CardFooter>
			<p class="text-sm text-muted-foreground">
				Already have an account?
				<a href="/auth/login" class="font-medium hover:text-primary ml-1">Sign in</a>
			</p>
		</CardFooter>
	</Card>
</div>
