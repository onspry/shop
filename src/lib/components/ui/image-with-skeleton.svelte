<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { ImageOff } from 'lucide-svelte';

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

	// Reset loading state when src changes
	$effect(() => {
		if (src) {
			imageLoaded = false;
			imageError = false;
		}
	});

	function handleLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleError() {
		imageError = true;
		imageLoaded = true; // Consider it "loaded" even if it failed
	}
</script>

<div
	class={`relative overflow-hidden ${className}`}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
	style:aspect-ratio={aspectRatio}
>
	{#if !imageLoaded || !src}
		<Skeleton class="absolute inset-0 w-full h-full z-10" />
	{/if}

	{#if src}
		<img
			{src}
			{alt}
			onload={handleLoad}
			onerror={handleError}
			class={`w-full h-full object-${objectFit} transition-opacity duration-300 ${!imageLoaded || imageError ? 'opacity-0' : 'opacity-100'}`}
			aria-hidden={imageError}
		/>
	{/if}

	{#if imageError && src}
		<div class="absolute inset-0 flex items-center justify-center bg-muted/5">
			<ImageOff class="h-6 w-6 text-muted-foreground" />
		</div>
	{/if}
</div>

<style>
	img {
		/* Hide the default browser broken image icon */
		&:-moz-broken {
			-moz-force-broken-image-icon: 0;
		}
	}
</style>
