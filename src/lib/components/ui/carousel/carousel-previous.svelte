<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { WithoutChildren } from 'bits-ui';
	import { getEmblaContext } from './context.js';
	import { cn } from '$lib/utils.js';
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'outline',
		size = 'icon',
		...restProps
	}: WithoutChildren<Props> = $props();

	const emblaCtx = getEmblaContext('<Carousel.Previous/>');
</script>

{#if emblaCtx.canScrollPrev}
	<Button
		{variant}
		{size}
		class={cn(
			'absolute size-10 touch-manipulation rounded-full bg-background/80 backdrop-blur-sm hover:bg-background',
			emblaCtx.orientation === 'horizontal'
				? 'left-4 top-1/2 -translate-y-1/2'
				: '-top-12 left-1/2 -translate-x-1/2 rotate-90',
			className
		)}
		onclick={emblaCtx.scrollPrev}
		onkeydown={emblaCtx.handleKeyDown}
		{...restProps}
		bind:ref
	>
		<ArrowLeft class="h-6 w-6" />
		<span class="sr-only">{m.sr_previous_slide()}</span>
	</Button>
{/if}
