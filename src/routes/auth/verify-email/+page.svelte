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

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<h1 class="mt-10 text-center text-2xl leading-9 font-bold tracking-tight">
			{m.verify_email_title()}
		</h1>
		<p class="mt-2 text-center text-sm text-gray-400">
			{m.verify_email_description({ email: data.email })}
		</p>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<form method="post" use:enhance action="?/verify" class="space-y-6">
			<div>
				<label for="form-verify.code" class="block text-sm font-medium">
					{m.verify_email_code_label()}
				</label>
				<div class="mt-2">
					<input
						id="form-verify.code"
						name="code"
						bind:value={code}
						required
						title={m.verify_email_code_validation()}
						inputmode="text"
						autocomplete="one-time-code"
						class:invalid={code && code.length !== 8}
						class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center text-2xl tracking-widest text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none"
						placeholder="2DZEK3LV"
					/>
				</div>
				{#if form?.verify?.message}
					<p class="mt-2 text-sm text-red-400">{form.verify.message}</p>
				{/if}
			</div>

			<div>
				<button
					type="submit"
					class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
					disabled={code.length !== 8}
					onclick={() => console.log('Submitting code:', code)}
				>
					{m.verify_email_verify_button()}
				</button>
			</div>
		</form>

		<div class="mt-6">
			<form method="post" use:enhance action="?/resend" onsubmit={handleResend}>
				<button
					type="submit"
					class="w-full text-sm text-yellow-500 hover:text-yellow-400 disabled:text-gray-500"
					disabled={isResendDisabled}
				>
					{#if resendCountdown > 0}
						{m.verify_email_resend_countdown({ seconds: resendCountdown })}
					{:else}
						{m.verify_email_resend_button()}
					{/if}
				</button>
				{#if form?.resend?.message}
					<p class="mt-2 text-center text-sm text-gray-400">{form.resend.message}</p>
				{/if}
			</form>
		</div>

		<div class="mt-10 text-center">
			<a href="/settings" class="text-sm text-yellow-500 hover:text-yellow-400">
				{m.verify_email_change_email_link()}
			</a>
		</div>
	</div>
</div>
