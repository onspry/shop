<script lang="ts">
	export let data;
	import * as m from '$lib/paraglide/messages.js';

	const { error, email, provider } = data;
	const formatProvider = (p: string | null) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : '');
</script>

{#if error === 'email_exists'}
	<div class="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-2xl font-bold text-red-600">
			{m.auth_error_account_exists()}
		</h2>

		<p class="mb-4">
			{m.auth_error_email_associated({
				email: email ?? '',
				provider: formatProvider(provider)
			})}
		</p>

		<p class="mb-6">
			{m.auth_error_use_existing_provider({
				attempted: formatProvider(data.attemptedProvider),
				existing: formatProvider(provider)
			})}
		</p>

		<div class="space-y-4">
			<a
				href="/auth/login"
				class="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
			>
				{m.auth_error_return_to_login()}
			</a>

			<a
				href="/"
				class="block w-full rounded border border-gray-300 px-4 py-2 text-center transition-colors hover:bg-gray-50"
			>
				{m.auth_error_go_to_homepage()}
			</a>
		</div>
	</div>
{:else}
	<div class="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-2xl font-bold text-red-600">
			{m.auth_error_generic_title()}
		</h2>
		<p class="mb-6">{m.auth_error_generic_message()}</p>

		<div class="space-y-4">
			<a
				href="/auth/login"
				class="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white transition-colors hover:bg-blue-700"
			>
				{m.auth_error_try_again()}
			</a>
		</div>
	</div>
{/if}
