<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

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

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>{m.verify_email_title()}</CardTitle>
			<CardDescription>{m.verify_email_description({ email: data.email })}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<form method="post" use:enhance action="?/verify" class="space-y-4">
				<div class="grid gap-2">
					<Label for="form-verify.code">{m.verify_email_code_label()}</Label>
					<Input
						id="form-verify.code"
						name="code"
						bind:value={code}
						required
						title={m.verify_email_code_validation()}
						inputmode="text"
						autocomplete="one-time-code"
						placeholder="2DZEK3LV"
					/>
					{#if form?.verify?.message}
						<p class="text-sm text-destructive">{form.verify.message}</p>
					{/if}
				</div>

				<Button type="submit" variant="default" class="w-full" disabled={code.length !== 8}>
					{m.verify_email_verify_button()}
				</Button>
			</form>

			<div class="text-center">
				<form
					method="post"
					use:enhance
					action="?/resend"
					onsubmit={handleResend}
					class="inline-block"
				>
					<Button type="submit" variant="ghost" disabled={isResendDisabled}>
						{#if resendCountdown > 0}
							{m.verify_email_resend_countdown({ seconds: resendCountdown })}
						{:else}
							{m.verify_email_resend_button()}
						{/if}
					</Button>
					{#if form?.resend?.message}
						<p class="text-sm text-destructive mt-2">{form.resend.message}</p>
					{/if}
				</form>
			</div>
		</CardContent>

		<CardFooter class="flex justify-center">
			<a href="/settings" class="text-sm text-muted-foreground hover:text-primary">
				{m.verify_email_change_email_link()}
			</a>
		</CardFooter>
	</Card>
</div>
