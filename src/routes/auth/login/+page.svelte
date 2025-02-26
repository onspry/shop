<script lang="ts">
	import { Providers } from '$lib/constants';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let showEmailForm = false;
	let isLoading = false;

	const socialProviders = [
		{
			name: 'GitHub',
			provider: Providers.github,
			logo: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
			</svg>`,
			bgColor: 'bg-gray-800',
			hoverColor: 'hover:bg-gray-700',
			textColor: 'text-white'
		},
		{
			name: 'Google',
			provider: Providers.google,
			logo: `<svg class="h-5 w-5" viewBox="0 0 24 24">
				<path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
				<path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
				<path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
				<path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
			</svg>`,
			bgColor: 'bg-white',
			hoverColor: 'hover:bg-gray-50',
			textColor: 'text-gray-900'
		},
		{
			name: 'Facebook',
			provider: Providers.facebook,
			logo: `<svg class="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
			</svg>`,
			bgColor: 'bg-white',
			hoverColor: 'hover:bg-gray-50',
			textColor: 'text-gray-900'
		}
	];

	async function handleSubmit(event: SubmitEvent) {
		isLoading = true;
		try {
			const form = event.target as HTMLFormElement;
			const response = await fetch(form.action, {
				method: 'POST',
				body: new FormData(form)
			});

			if (response.redirected) {
				window.location.href = response.url;
			}
		} finally {
			isLoading = false;
		}
		event.preventDefault();
	}
</script>

<div class="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-gray-900/50 p-8 backdrop-blur-sm">
		<div class="text-center">
			<h2 class="used-text text-3xl font-bold">Welcome Back</h2>
			<p class="mt-2 text-gray-400">Sign in to your account</p>
		</div>

		<div class="space-y-4">
			{#each socialProviders as provider}
				<a
					href="/auth/login/{provider.provider}"
					class="used-look flex w-full items-center justify-center gap-3 rounded-lg {provider.bgColor} {provider.hoverColor} px-4 py-2.5 text-sm font-semibold {provider.textColor} transition-colors duration-200"
				>
					{@html provider.logo}
					Continue with {provider.name}
				</a>
			{/each}

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-black px-2 text-gray-400">Or continue with</span>
				</div>
			</div>

			<button
				type="button"
				class="used-look w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
				on:click={() => (showEmailForm = true)}
			>
				Email & Password
			</button>
		</div>

		{#if showEmailForm}
			<form
				method="POST"
				action="/auth/login/email"
				class="mt-8 space-y-6"
				on:submit={handleSubmit}
			>
				<div class="space-y-4 rounded-md">
					<div>
						<label for="email" class="sr-only">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							class="relative block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:z-10 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
							placeholder="Email address"
						/>
					</div>
					<div>
						<label for="password" class="sr-only">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							class="relative block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:z-10 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
							placeholder="Password"
						/>
					</div>
				</div>

				<div class="mt-2 flex items-center justify-between">
					<a href="/auth/forgot-password" class="text-sm text-gray-400 hover:text-gray-300">
						{m.auth_forgot_password()}
					</a>
				</div>

				<div>
					<button
						type="submit"
						class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
						disabled={isLoading}
					>
						{#if isLoading}
							<LoadingSpinner {isLoading} />
						{:else}
							Login
						{/if}
					</button>
				</div>
			</form>
		{/if}

		<p class="text-center text-sm text-gray-400">
			Don't have an account?
			<a href="/auth/register" class="font-semibold text-yellow-500 hover:text-yellow-400"
				>Sign up</a
			>
		</p>
	</div>
</div>
