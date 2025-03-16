<script lang="ts">
	export let data;
	import * as m from '$lib/paraglide/messages.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle } from 'lucide-svelte';

	const { error, email, provider } = data;
	const formatProvider = (p: string | null) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : '');
</script>

<div
	class="container flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center py-8"
>
	<Card class="w-full max-w-md">
		{#if error === 'email_exists'}
			<CardHeader>
				<div class="flex items-center gap-2 text-amber-500 mb-2">
					<AlertTriangle class="h-5 w-5" />
					<CardTitle>{m.auth_error_account_exists()}</CardTitle>
				</div>
				<CardDescription>
					{m.auth_error_email_associated({
						email: email ?? '',
						provider: formatProvider(provider)
					})}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<p class="text-sm text-muted-foreground mb-4">
					{m.auth_error_use_existing_provider({
						attempted: formatProvider(data.attemptedProvider),
						existing: formatProvider(provider)
					})}
				</p>
			</CardContent>

			<CardFooter class="flex flex-col gap-2">
				<Button variant="default" class="w-full" href="/auth/login">
					{m.auth_error_return_to_login()}
				</Button>
				<Button variant="outline" class="w-full" href="/">
					{m.auth_error_go_to_homepage()}
				</Button>
			</CardFooter>
		{:else}
			<CardHeader>
				<div class="flex items-center gap-2 text-destructive mb-2">
					<AlertTriangle class="h-5 w-5" />
					<CardTitle>{m.auth_error_generic_title()}</CardTitle>
				</div>
				<CardDescription>
					{m.auth_error_generic_message()}
				</CardDescription>
			</CardHeader>

			<CardFooter>
				<Button variant="default" class="w-full" href="/auth/login">
					{m.auth_error_try_again()}
				</Button>
			</CardFooter>
		{/if}
	</Card>
</div>
