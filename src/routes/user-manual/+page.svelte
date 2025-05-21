<script lang="ts">
	import StructuredContent from '$lib/components/structured-content.svelte';

	// Get data from the server using the new runes syntax
	const props = $props();

	// Extract structured content from data
	const { data } = props;
</script>

<StructuredContent
	title={data.title}
	intro={data.intro}
	sections={data.sections}
	showBackButton={true}
/>
