<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);
	let password = $state('');
</script>

<div>
	<div>
		<div>
			<h2>{m.reset_password_title()}</h2>
			<p>{m.reset_password_description()}</p>
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
					<label for="password">{m.reset_password_new_password_label()}</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						placeholder={m.reset_password_new_password_label()}
					/>
					{#if form?.message}
						<p>{form.message}</p>
					{/if}
				</div>
			</div>

			<div>
				<button type="submit" disabled={isLoading || !password}>
					{#if isLoading}
						<LoadingSpinner />
					{:else}
						{m.reset_password_submit()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
