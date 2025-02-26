<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// State for code input
	let code = $state('');
	let isResendDisabled = $state(false);
	let resendCountdown = $state(0);

	// Handle resend cooldown
	$effect(() => {
		if (resendCountdown > 0) {
			const timer = setInterval(() => {
				resendCountdown--;
				if (resendCountdown === 0) {
					isResendDisabled = false;
				}
			}, 1000);
			return () => clearInterval(timer);
		}
	});

	// Handle resend click
	function handleResend() {
		isResendDisabled = true;
		resendCountdown = 60; // 60 second cooldown
	}
</script>

<div>
	<div>
		<h1>{m.verify_email_title()}</h1>
		<p>{m.verify_email_description({ email: data.email })}</p>
	</div>

	<div>
		<form method="post" use:enhance action="?/verify">
			<div>
				<label for="form-verify.code">{m.verify_email_code_label()}</label>
				<div>
					<input
						id="form-verify.code"
						name="code"
						bind:value={code}
						required
						title={m.verify_email_code_validation()}
						inputmode="text"
						autocomplete="one-time-code"
						placeholder="2DZEK3LV"
					/>
				</div>
				{#if form?.verify?.message}
					<p>{form.verify.message}</p>
				{/if}
			</div>

			<div>
				<button type="submit" disabled={code.length !== 8}>
					{m.verify_email_verify_button()}
				</button>
			</div>
		</form>

		<div>
			<form method="post" use:enhance action="?/resend" onsubmit={handleResend}>
				<button type="submit" disabled={isResendDisabled}>
					{#if resendCountdown > 0}
						{m.verify_email_resend_countdown({ seconds: resendCountdown })}
					{:else}
						{m.verify_email_resend_button()}
					{/if}
				</button>
				{#if form?.resend?.message}
					<p>{form.resend.message}</p>
				{/if}
			</form>
		</div>

		<div>
			<a href="/settings">{m.verify_email_change_email_link()}</a>
		</div>
	</div>
</div>
