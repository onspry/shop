<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	const email = 'support@onspry.com';
	const gdprUrl = 'https://gdpr-info.eu/';
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
				<h1 class="text-4xl font-medium">{m.privacy_title()}</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.privacy_intro()}
					{@html m.privacy_no_share()}
					{@html m.privacy_deletion_request({ email })}
					{@html m.privacy_more_info()}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.privacy_gdpr_rights_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.privacy_gdpr_rights({ gdprUrl })}
					{@html m.privacy_gdpr_exercise({ email })}
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">{m.privacy_processing_title()}</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.privacy_processing()}
					{@html m.privacy_gdpr_more({ gdprUrl })}
				</div>
			</div>
			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
			</div>
		</div>
	</div>
</div>
