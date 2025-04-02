<script lang="ts">
	import { LoaderCircle } from 'lucide-svelte/icons';
	export let size = 24;
	export let className: string = '';
</script>

<LoaderCircle {size} class="animate-spin {className}" />
