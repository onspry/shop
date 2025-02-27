<script lang="ts">
	import { Providers } from '$lib/constants';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let showEmailForm = false;
	let isLoading = false;

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

<div>
	<div>
		<div>
			<h2>Welcome Back</h2>
			<p>Sign in to your account</p>
		</div>

		<div>
			{#each socialProviders as provider}
				<a href="/auth/login/{provider.provider}">
					{@html provider.logo}
					Continue with {provider.name}
				</a>
			{/each}

			<div>
				<div>
					<div></div>
				</div>
				<div>
					<span>Or continue with</span>
				</div>
			</div>

			<button type="button" on:click={() => (showEmailForm = true)}>Email & Password</button>
		</div>

		{#if showEmailForm}
			<form method="POST" action="/auth/login/email" on:submit={handleSubmit}>
				<div>
					<div>
						<label for="email">Email address</label>
						<input id="email" name="email" type="email" required placeholder="Email address" />
					</div>
					<div>
						<label for="password">Password</label>
						<input id="password" name="password" type="password" required placeholder="Password" />
					</div>
				</div>

				<div>
					<a href="/auth/forgot-password">{m.auth_forgot_password()}</a>
				</div>

				<div>
					<button type="submit" disabled={isLoading}>
						{#if isLoading}
							<LoadingSpinner {isLoading} />
						{:else}
							Login
						{/if}
					</button>
				</div>
			</form>
		{/if}

		<p>
			Don't have an account?
			<a href="/auth/register">Sign up</a>
		</p>
	</div>
</div>
