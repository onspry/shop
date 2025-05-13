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

<div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Order Confirmation Header -->
	<div class="text-center mb-12">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
			<CheckCircle class="h-8 w-8 text-primary" />
		</div>
		<h1 class="text-3xl font-bold mb-2">{m.order_confirmation_thank_you()}</h1>
		<p class="text-xl text-muted-foreground mb-4">
			{m.order_confirmation_email_sent()}
		</p>

		<Card class="max-w-md mx-auto">
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
	<div class="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
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
