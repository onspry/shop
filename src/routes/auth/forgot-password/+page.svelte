<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let isLoading = $state(false);
</script>

<div>
	<div>
		<div>
			<h2>{m.auth_forgot_password_title()}</h2>
			<p>{m.auth_forgot_password_description()}</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				isLoading = true;
				return async ({ update }) => {
					await update();
					isLoading = false;
				};
			}}
		>
			<div>
				<div>
					<label for="email">{m.auth_forgot_password_email_placeholder()}</label>
					<input id="email" name="email" type="email" required />
				</div>
			</div>

			<div>
				<button type="submit" disabled={isLoading}>
					{#if isLoading}
						<LoadingSpinner />
					{:else}
						{m.auth_forgot_password_submit()}
					{/if}
				</button>
			</div>
		</form>

		<p>
			{m.auth_forgot_password_remember()}
			<a href="/auth/login">{m.auth_forgot_password_login()}</a>
		</p>
	</div>
</div>
