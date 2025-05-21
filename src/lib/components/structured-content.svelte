<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';
	import type { ContentSection } from '$lib/utils/content-parser';

	// Content data props with runes
	const {
		title = '',
		intro = '',
		sections = [],
		showBackButton = true
	} = $props<{
		title?: string;
		intro?: string;
		sections?: (ContentSection | { title: string; content: string })[];
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

	// Recursive function to render a section and its children
	function renderSection(
		section: ContentSection | { title: string; content: string },
		level = 2
	): string {
		// Handle both old and new format
		const hasChildren =
			'children' in section && Array.isArray(section.children) && section.children.length > 0;
		const sectionLevel = 'level' in section ? section.level : level;

		// Determine the heading level (h2, h3, etc.)
		const headingLevel = Math.min(Math.max(sectionLevel, 2), 6); // Ensure between h2 and h6

		return `
			<div class="space-y-8 section-level-${headingLevel}">
				<h${headingLevel}>${section.title}</h${headingLevel}>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					${section.content}
				</div>
				${hasChildren ? section.children.map((child) => renderSection(child, sectionLevel + 1)).join('') : ''}
			</div>
		`;
	}
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
				<h1>{title}</h1>

				<!-- Intro Content -->
				{#if intro}
					<div class="prose prose-lg dark:prose-invert max-w-none">
						{@html intro}
					</div>
				{/if}
			</div>

			<!-- Content Sections -->
			{#each sections as section}
				{@html renderSection(section)}
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
