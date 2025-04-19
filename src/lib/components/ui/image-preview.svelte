<script lang="ts">
	import { ImageOff } from 'lucide-svelte';

	const props = $props<{
		src: string;
		alt?: string;
		width: number;
		height: number;
		className?: string;
		onError?: (src: string) => void;
	}>();

	let isLoading = $state(true);
	let hasError = $state(false);

	// Function to get optimized image URL
	// Note: w and h parameters are kept for API compatibility but not used
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function getOptimizedImageUrl(url: string, w: number, h: number): string {
		if (!url) return '';

		// If it's already a full URL, return it as is
		if (url.startsWith('http')) {
			return url;
		}

		// For paths that start with /images/ (from the database)
		// We need to keep the path as is, since our server route will handle it
		if (url.startsWith('/images/')) {
			return url;
		}

		// If it's a relative path without the /images/ prefix
		if (!url.startsWith('/')) {
			return `/images/${url}`;
		}

		// Default case - just return the URL
		return url;
	}

	// Reset error state when src changes
	$effect(() => {
		if (props.src) {
			isLoading = true;
			hasError = false;
		}
	});
</script>

<div class="aspect-square overflow-hidden rounded-md bg-muted/5 relative {props.className}">
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
			onerror={() => {
				hasError = true;
				if (props.onError) props.onError(props.src);
			}}
		/>
		{#if isLoading}
			<div class="absolute inset-0 z-20 flex items-center justify-center">
				<div class="absolute inset-0 animate-pulse bg-muted-foreground/20"></div>
			</div>
		{/if}
	{/if}
</div>
