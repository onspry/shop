<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';

	let { class: className } = $props();
</script>

<div class={cn('flex items-center', className)}>
	<img src="/logo-dark.svg" alt={m.shop_title()} class="h-8 w-auto hidden dark:block" />
	<img src="/logo-light.svg" alt={m.shop_title()} class="h-8 w-auto block dark:hidden" />
</div>
