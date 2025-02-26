<script lang="ts">
	export let data;
	import * as m from '$lib/paraglide/messages.js';

	const { error, email, provider } = data;
	const formatProvider = (p: string | null) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : '');
</script>

{#if error === 'email_exists'}
	<div>
		<h2>{m.auth_error_account_exists()}</h2>

		<p>
			{m.auth_error_email_associated({
				email: email ?? '',
				provider: formatProvider(provider)
			})}
		</p>

		<p>
			{m.auth_error_use_existing_provider({
				attempted: formatProvider(data.attemptedProvider),
				existing: formatProvider(provider)
			})}
		</p>

		<div>
			<a href="/auth/login">{m.auth_error_return_to_login()}</a>
			<a href="/">{m.auth_error_go_to_homepage()}</a>
		</div>
	</div>
{:else}
	<div>
		<h2>{m.auth_error_generic_title()}</h2>
		<p>{m.auth_error_generic_message()}</p>

		<div>
			<a href="/auth/login">{m.auth_error_try_again()}</a>
		</div>
	</div>
{/if}
