<script lang="ts">
	import { ImageOff } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	const props = $props<{
		src: string;
		alt?: string;
		width?: number | string;
		height?: number | string;
		className?: string;
		aspectRatio?: string;
		objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
		showPlaceholder?: boolean;
		thumbnailMode?: boolean;
		isSelected?: boolean;
	}>();

	// Default values
	const objectFit = props.objectFit || 'contain';
	const showPlaceholder = props.showPlaceholder !== false;
	const thumbnailMode = props.thumbnailMode || false;

	// Derive isSelected from props
	const isSelected = $derived(props.isSelected || false);

	// State
	let isLoading = $state(true);
	let hasError = $state(false);

	// Function to get optimized image URL
	function getOptimizedImageUrl(url: string): string {
		// console.log('[APP-IMAGE] Processing URL:', url);
		if (!url) {
			// console.log('[APP-IMAGE] Empty URL provided');
			return '';
		}

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

	// Handle image load
	function handleLoad() {
		isLoading = false;
	}

	// Handle image error
	function handleError() {
		hasError = true;
		isLoading = false;
	}
</script>

<div
	class={cn(
		'relative overflow-hidden bg-muted/5 transition-all duration-200',
		thumbnailMode ? 'aspect-square rounded-md' : '',
thumbnailMode && !isSelected ? 'border border-border/50' : '',
thumbnailMode && isSelected ? 'border border-primary' : '',
		props.className
	)}
	style:width={typeof props.width === 'number' ? `${props.width}px` : props.width}
	style:height={typeof props.height === 'number' ? `${props.height}px` : props.height}
	style:aspect-ratio={props.aspectRatio || 'auto'}
>
	{#if hasError}
		<!-- Error state -->
		<div class="absolute inset-0 flex items-center justify-center bg-muted/30 backdrop-blur-sm">
			<div class="text-muted-foreground bg-background/80 p-2 rounded-full">
				<ImageOff
					size={thumbnailMode ? 24 : 48}
					strokeWidth={1.5}
				/>
			</div>
		</div>
	{:else}
		<!-- Image -->
		<img
			src={getOptimizedImageUrl(props.src)}
			alt={props.alt ?? ''}
			width={typeof props.width === 'number' ? props.width : undefined}
			height={typeof props.height === 'number' ? props.height : undefined}
			loading="lazy"
			class={cn(
				'relative z-0 h-full w-full transition-opacity duration-300',
				`object-${objectFit}`,
				isLoading ? 'opacity-0' : 'opacity-100',
				'max-h-full'
			)}
			onload={handleLoad}
			onerror={handleError}
		/>

		<!-- Loading state -->
		{#if isLoading && showPlaceholder}
			<div class="absolute inset-0 z-5 flex items-center justify-center">
				<div class="absolute inset-0 animate-pulse bg-muted-foreground/10 rounded-md"></div>
			</div>
		{/if}
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
