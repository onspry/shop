<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData } from './$types';

	let { data, form } = $props<{ form: ActionData }>();
	let isLoading = $state(false);
	let code = $state('');
</script>

<div>
	<div>
		<div>
			<h2>{m.verify_email_title()}</h2>
			<p>{m.verify_email_description({ email: data.email })}</p>
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
					<label for="code">{m.verify_email_code_label()}</label>
					<input
						id="code"
						name="code"
						type="text"
						required
						bind:value={code}
						placeholder="2DZEK3LV"
					/>
					{#if form?.message}
						<p>{form.message}</p>
					{/if}
				</div>
			</div>

			<div>
				<button type="submit" disabled={isLoading || !code}>
					{#if isLoading}
						<LoadingSpinner />
					{:else}
						{m.verify_email_verify_button()}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
