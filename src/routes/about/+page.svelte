<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	// Get data from the server using the new runes syntax
	const { content } = $props();

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
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
		<!-- Render the dynamically loaded Markdown content -->
		<div class="space-y-12">
			<div class="prose prose-lg dark:prose-invert max-w-none">
				{@html content}
			</div>

			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>{m.button_back()}</Button>
			</div>
		</div>
	</div>
</div>
