<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas/auth';
	import { Providers } from '$lib/constants';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
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

	// Get the redirect URL from the server data
	const redirectTo = data.redirectTo || '/';

	// Initialize the form with Superform
	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod(loginSchema),
		validationMethod: 'auto'
	});

	let showEmailForm = $state(false);
	let loadingProvider = $state<string | null>(null);

	function toggleEmailForm(show: boolean) {
		showEmailForm = show;
	}

	// Show email form if there are validation errors
	$effect(() => {
		if ($errors.email || $errors.password || $message) {
			showEmailForm = true;
		}
	});

	function handleSocialLogin(provider: string) {
		loadingProvider = provider;
		// Append the redirect parameter to the social login URL
		const redirectParam = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
		window.location.href = `/auth/login/${provider}${redirectParam}`;
	}

	const socialProviders = [
		{
			name: 'GitHub',
			provider: Providers.github,
			logo: `<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
			</svg>`
		},
		{
			name: 'Google',
			provider: Providers.google,
			logo: `<svg viewBox="0 0 24 24">
				<path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
				<path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
				<path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
				<path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
			</svg>`
		},
		{
			name: 'Facebook',
			provider: Providers.facebook,
			logo: `<svg fill="#1877F2" viewBox="0 0 24 24">
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
			</svg>`
		}
	];
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Welcome Back</CardTitle>
			<CardDescription>Sign in to your account</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid gap-4">
				{#each socialProviders as provider}
					<Button
						variant="outline"
						class="h-11 w-full"
						onclick={() => handleSocialLogin(provider.provider)}
						disabled={loadingProvider !== null}
					>
						<div class="flex h-full w-full items-center justify-center gap-3">
							{#if loadingProvider === provider.provider}
								<LoadingSpinner size={20} />
							{:else}
								<div class="h-5 w-5 shrink-0">
									{@html provider.logo}
								</div>
							{/if}
							<span>Continue with {provider.name}</span>
						</div>
					</Button>
				{/each}
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<Separator class="w-full" />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-background px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>

			{#if !showEmailForm}
				<Button
					variant="outline"
					class="w-full"
					onclick={() => toggleEmailForm(true)}
					disabled={loadingProvider !== null}
				>
					Email & Password
				</Button>
			{:else}
				<form
					method="POST"
					action={`?/email${redirectTo !== '/' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`}
					class="space-y-4"
					use:enhance
				>
					<!-- Hidden input to preserve the redirect parameter -->
					<input type="hidden" name="redirectTo" value={redirectTo} />

					<div class="grid gap-2">
						<Label for="email">Email address</Label>
						<Input
							id="email"
							name="email"
							type="email"
							bind:value={$form.email}
							placeholder="name@example.com"
							autocomplete="email"
							aria-invalid={$errors.email ? 'true' : undefined}
							disabled={$submitting || loadingProvider !== null}
						/>
						{#if $errors.email}
							<p class="text-sm text-destructive">{$errors.email}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							bind:value={$form.password}
							placeholder="Enter your password"
							autocomplete="current-password"
							aria-invalid={$errors.password ? 'true' : undefined}
							disabled={$submitting || loadingProvider !== null}
						/>
						{#if $errors.password}
							<p class="text-sm text-destructive">{$errors.password}</p>
						{/if}
					</div>

					{#if $message}
						<div class="text-sm text-destructive">
							{$message}
						</div>
					{/if}

					<div class="text-sm">
						<a href="/auth/forgot-password" class="text-muted-foreground hover:text-primary">
							{m.auth_forgot_password()}
						</a>
					</div>

					<Button
						type="submit"
						variant="default"
						class="w-full"
						disabled={$submitting || loadingProvider !== null}
					>
						{#if $submitting}
							<LoadingSpinner size={16} className="mr-2" />
						{/if}
						{m.sign_in()}
					</Button>
				</form>
			{/if}
		</CardContent>
		<CardFooter>
			<p class="text-sm text-muted-foreground">
				Don't have an account?
				<a
					href={`/auth/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
					class="font-medium hover:text-primary"
				>
					Sign up
				</a>
			</p>
		</CardFooter>
	</Card>
</div>
