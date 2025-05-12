<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	const email = 'support@onspry.com';
	const privacyUrl = '/privacy';
	let contentVisible = $state(false);
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="transition-opacity duration-500"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	<div class="text-only">
		<div class="space-y-12">
			<div class="space-y-4">
				<h1 class="text-4xl font-medium">{m.terms_title()}</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_intro()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_user_accounts_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_user_accounts()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_privacy_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_privacy({ privacyUrl })}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_acceptable_use_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_acceptable_use()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_orders_payments_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_orders_payments()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_limitation_liability_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_limitation_liability()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_changes_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_changes()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.terms_contact_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.terms_contact({ email })}
				</div>
			</div>
			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
			</div>
		</div>
	</div>
</div>
