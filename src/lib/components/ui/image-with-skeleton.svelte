<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let {
		src = '',
		alt = '',
		className = '',
		width,
		height,
		aspectRatio,
		objectFit = 'cover'
	} = $props<{
		src: string;
		alt: string;
		className?: string;
		width?: number | string;
		height?: number | string;
		aspectRatio?: string;
		objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
	}>();

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleLoad() {
		imageLoaded = true;
	}

	function handleError() {
		imageError = true;
		imageLoaded = true; // Consider it "loaded" even if it failed
	}
</script>

<div
	class={`relative ${className}`}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
	style:aspect-ratio={aspectRatio}
>
	{#if !imageLoaded}
		<Skeleton class="absolute inset-0 w-full h-full rounded-md" />
	{/if}

	<img
		{src}
		{alt}
		onload={handleLoad}
		onerror={handleError}
		class={`w-full h-full object-${objectFit} rounded-md transition-opacity duration-300 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
	/>

	{#if imageError}
		<div class="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md">
			<span class="text-muted-foreground text-sm">Failed to load image</span>
		</div>
	{/if}
</div>
