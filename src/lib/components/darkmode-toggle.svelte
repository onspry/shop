<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { theme } from '$lib/stores/theme';

	// Subscribe to theme changes and update the DOM
	$effect(() => {
		const isDark = $theme === 'dark';
		document.documentElement.classList.toggle('dark', isDark);
	});
</script>

<Button onclick={() => theme.toggle()} variant="ghost" size="icon">
	<Sun
		class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
	/>
	<Moon
		class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
	/>
	<span class="sr-only">Toggle theme</span>
</Button>
