<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);

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
			<h2 class="used-text text-3xl font-bold">{m.auth_forgot_password_title()}</h2>
			<p class="mt-2 text-gray-400">{m.auth_forgot_password_description()}</p>
		</div>

		<form
			method="POST"
			class="mt-8 space-y-6"
			use:enhance={() => {
				isLoading = true;
				return async ({ update }) => {
					await update();
					isLoading = false;
				};
			}}
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
						placeholder={m.auth_forgot_password_email_placeholder()}
					/>
				</div>
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
						{m.auth_forgot_password_submit()}
					{/if}
				</button>
			</div>
		</form>

		<p class="text-center text-sm text-gray-400">
			{m.auth_forgot_password_remember()}
			<a href="/auth/login" class="font-semibold text-yellow-500 hover:text-yellow-400">
				{m.auth_forgot_password_login()}
			</a>
		</p>
	</div>
</div>
