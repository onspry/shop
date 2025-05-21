<script lang="ts">
	let { error, status } = $props();
	import { onMount } from 'svelte';
	import { XCircle, AlertCircle, RefreshCcw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { localizeHref } from '$lib/paraglide/runtime';
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
	class="flex flex-col items-center justify-center px-4 py-24"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	<div class="relative mb-6 h-24 w-24">
		<AlertCircle size={64} class="absolute text-destructive" />
		<div class="h-full w-full animate-pulse rounded-full bg-muted/20"></div>
	</div>
	<h1 class="mb-3 text-center">{m.error_something_went_wrong()}</h1>
	<p class="mb-8 max-w-md text-center text-lg text-muted-foreground">
		{m.error_check_connection()}
	</p>
	<div class="flex flex-col gap-4 sm:flex-row">
		<Button onclick={() => window.location.reload()} class="px-8" size="lg">
			{m.error_try_again()}
			<RefreshCcw class="ml-2 h-5 w-5" />
		</Button>
		<Button href={localizeHref('/')} variant="outline" size="lg">{m.return_to_home()}</Button>
	</div>
</div>
