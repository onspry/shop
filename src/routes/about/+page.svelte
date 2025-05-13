<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	// Get data from the server using the new runes syntax
	const props = $props();

	// The content is structured in the data property
	const { data } = props;
	const title = data?.title || 'About Us';
	const intro = data?.intro || '';
	const sections = data?.sections || [];

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
		<div class="space-y-12">
			<!-- Main Title Section -->
			<div class="space-y-4">
				<h1 class="text-4xl font-medium">{title}</h1>

				<!-- Intro Content -->
				{#if intro}
					<div class="prose prose-lg dark:prose-invert max-w-none">
						{@html intro}
					</div>
				{/if}
			</div>

			<!-- Content Sections -->
			{#each sections as section}
				<div class="space-y-8">
					<h2 class="text-2xl font-medium">{section.title}</h2>
					<div class="prose prose-lg dark:prose-invert max-w-none">
						{@html section.content}
					</div>
				</div>
			{/each}

			<!-- Back Button -->
			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>{m.button_back()}</Button>
			</div>
		</div>
	</div>
</div>
