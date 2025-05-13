<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
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
				<h1 class="text-4xl font-medium">{m.data_deletion_title()}</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					{@html m.privacy_deletion_request({ email: 'support@onspry.com' })}
					<p>{m.privacy_data_deletion_message()}</p>
				</div>
			</div>
		</div>
	</div>
</div>
