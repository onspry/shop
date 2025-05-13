<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	// Content data props with runes
	const {
		title = '',
		intro = '',
		sections = [],
		showBackButton = true
	} = $props<{
		title?: string;
		intro?: string;
		sections?: { title: string; content: string }[];
		showBackButton?: boolean;
	}>();

	// Animation state
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
	<div class="text-only container">
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
			{#if showBackButton}
				<div class="flex justify-center pt-8">
					<Button variant="outline" onclick={() => window.history.back()}>{m.button_back()}</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
