<script lang="ts">
	import { ImageOff } from 'lucide-svelte';

	const props = $props<{
		src: string;
		alt?: string;
		width: number;
		height: number;
		className?: string;
	}>();

	let isLoading = $state(true);
	let hasError = $state(false);

	function getOptimizedImageUrl(url: string, w: number, h: number): string {
		if (!url) return '';
		if (!url.startsWith('/') && !url.startsWith('http')) {
			url = '/' + url;
		}
		return `${url}?w=${w}&h=${h}&q=80&format=webp`;
	}
</script>

<div class="aspect-square overflow-hidden rounded-md bg-muted relative {props.className}">
	{#if hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-muted">
			<div class="text-muted-foreground">
				<ImageOff size={props.width > 400 ? 48 : 24} strokeWidth={1.5} />
			</div>
		</div>
	{:else}
		<img
			src={getOptimizedImageUrl(props.src, props.width, props.height)}
			alt={props.alt ?? ''}
			width={props.width}
			height={props.height}
			loading="lazy"
			class="relative z-10 h-full w-full object-cover object-center"
			onload={() => (isLoading = false)}
			onerror={() => (hasError = true)}
		/>
		{#if isLoading}
			<div class="absolute inset-0 z-20 flex items-center justify-center">
				<div class="absolute inset-0 animate-pulse bg-muted-foreground/20"></div>
			</div>
		{/if}
	{/if}
</div>
