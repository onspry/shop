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
						<LoadingSpinner {isLoading} />
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
