<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { userStore } from '$lib/stores/auth';
	import { localizeHref } from '$lib/paraglide/runtime';

	// Get user status
	const user = $derived($userStore);
</script>

<div class="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
	<!-- Order Confirmation Header -->
	<div class="mb-12 text-center">
		<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
			<CheckCircle class="h-8 w-8 text-primary" />
		</div>
		<h1 class="mb-2">{m.order_confirmation_thank_you()}</h1>
		<p class="mb-4 text-xl text-muted-foreground">
			{m.order_confirmation_email_sent()}
		</p>

		<Card class="mx-auto max-w-md">
			<CardContent class="pt-6">
				<p class="mb-4">{m.order_email_updates()}</p>

				{#if user}
					<p class="mb-4">
						{m.order_view_in_account()}
					</p>
				{:else}
					<p class="mb-4">
						{m.order_create_account_suggestion()}
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Action Buttons -->
	<div class="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
		{#if user}
			<Button variant="outline" href={localizeHref('/orders')} class="flex items-center gap-2">
				{m.order_view_all()}
				<ArrowRight class="h-4 w-4" />
			</Button>
		{:else}
			<Button
				variant="outline"
				href={localizeHref('/auth/register')}
				class="flex items-center gap-2"
			>
				{m.create_account()}
				<ArrowRight class="h-4 w-4" />
			</Button>
		{/if}
		<Button href={localizeHref('/products')} class="flex items-center gap-2">
			{m.order_continue_shopping()}
			<ShoppingBag class="h-4 w-4" />
		</Button>
	</div>
</div>
