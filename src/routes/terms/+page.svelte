<script lang="ts">
	import StructuredContent from '$lib/components/structured-content.svelte';
	const props = $props();
	const { data } = props;
</script>

<StructuredContent
	title={data.title}
	intro={data.intro}
	sections={data.sections}
	showBackButton={true}
/>
