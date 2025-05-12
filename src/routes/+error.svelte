<script lang="ts">
	let { error, status } = $props();
	import { onMount } from 'svelte';
	import { XCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime';
	let contentVisible = $state(false);
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="flex flex-col items-center justify-center py-24 px-4 transition-opacity duration-500"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	<div class="w-24 h-24 mb-6 flex items-center justify-center relative">
		<XCircle size={64} class="text-orange-500 mx-auto" />
		<div class="w-full h-full rounded-full bg-muted/20 animate-pulse absolute top-0 left-0"></div>
	</div>
	<h1 class="text-3xl font-bold mb-3 text-center">Oops! Something went wrong.</h1>
	<p class="text-muted-foreground mb-8 text-center max-w-md text-lg">
		{error?.message ?? 'An unexpected error occurred. Please try again later.'}
	</p>
	<Button href={localizeHref('/')} variant="default">Return to Home</Button>
</div>
