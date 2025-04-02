<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { ChevronDown } from 'lucide-svelte/icons';

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<DropdownMenuPrimitive.Trigger
	class={cn(
		'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-muted',
		className
	)}
	{...$$restProps}
>
	<slot />
</DropdownMenuPrimitive.Trigger>
