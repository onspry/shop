<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);
	let password = $state('');
</script>

<div class="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-gray-900/50 p-8 backdrop-blur-sm">
		<div class="text-center">
			<h2 class="used-text text-3xl font-bold">{m.reset_password_title()}</h2>
			<p class="mt-2 text-gray-400">{m.reset_password_description()}</p>
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
					<label for="password" class="sr-only">{m.reset_password_new_password_label()}</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						class="relative block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:z-10 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
						placeholder={m.reset_password_new_password_label()}
					/>
					{#if form?.message}
						<p class="mt-2 text-sm text-red-400">{form.message}</p>
					{/if}
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
					disabled={isLoading || !password}
				>
					{#if isLoading}
						<LoadingSpinner {isLoading} />
					{:else}
						{m.reset_password_submit()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
