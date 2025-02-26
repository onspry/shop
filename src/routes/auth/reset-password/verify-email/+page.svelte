<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
	let isLoading = $state(false);
	let code = $state('');
</script>

<div class="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
	<div class="w-full max-w-md space-y-8 rounded-xl bg-gray-900/50 p-8 backdrop-blur-sm">
		<div class="text-center">
			<h2 class="used-text text-3xl font-bold">{m.verify_email_title()}</h2>
			<p class="mt-2 text-gray-400">{m.verify_email_description({ email: data.email })}</p>
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
					<label for="code" class="sr-only">{m.verify_email_code_label()}</label>
					<input
						id="code"
						name="code"
						type="text"
						required
						bind:value={code}
						title={m.verify_email_code_validation()}
						class="relative block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center text-2xl tracking-widest text-gray-200 placeholder-gray-400 focus:z-10 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none"
						placeholder="2DZEK3LV"
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
					disabled={isLoading || !code || code.length !== 8}
				>
					{#if isLoading}
						<LoadingSpinner {isLoading} />
					{:else}
						{m.verify_email_verify_button()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
