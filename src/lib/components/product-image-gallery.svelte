<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import AppImage from '$lib/components/ui/app-image.svelte';
	import type { ProductImageViewModel } from '$lib/models/product';

	const props = $props<{
		images: ProductImageViewModel[];
	}>();

	// Internal state for tracking the selected image
	let displayIndex = $state(0);

	// Calculate number of valid images
	const validImageCount = $derived(props.images?.length || 0);

	// Function to handle image selection
	function handleImageSelect(index: number) {
		// Update local state
		displayIndex = index;
	}
</script>

{#if props.images?.length > 0}
	{#if validImageCount > 1}
		<!-- Multiple images: show thumbnails on the left -->
		<div class="flex gap-4">
			<div class="flex flex-col gap-3 w-24">
				{#each props.images as image, index}
					<Button
						variant="ghost"
						size="icon"
						onclick={() => handleImageSelect(index)}
						aria-label="View {image.alt}"
						class="p-0 h-auto w-auto flex items-center justify-center hover:bg-transparent overflow-hidden transition-all duration-200"
					>
						<AppImage
							src={image.url}
							alt={image.alt}
							width={90}
							height={90}
							thumbnailMode={true}
							isSelected={displayIndex === index}
						/>
					</Button>
				{/each}
			</div>

			<!-- Main image (with thumbnails) -->
			<div class="flex-1">
				<div class="flex items-center justify-center max-w-lg mx-auto overflow-hidden rounded-lg min-h-[400px] max-h-[calc(100vh-var(--header-height)-var(--footer-height)-8rem)]">
					<AppImage
						src={props.images[displayIndex].url}
						alt={props.images[displayIndex].alt}
						width="100%"
						height="auto"
						aspectRatio="auto"
						objectFit="contain"
					/>
				</div>
			</div>
		</div>
	{:else}
		<!-- Single image: centered with no thumbnails -->
		<div class="w-full">
			<div class="flex items-center justify-center max-w-lg mx-auto overflow-hidden rounded-lg min-h-[400px] max-h-[calc(100vh-var(--header-height)-var(--footer-height)-8rem)]">
				<AppImage
					src={props.images[0].url}
					alt={props.images[0].alt}
					width="100%"
					height="auto"
					aspectRatio="auto"
					objectFit="contain"
				/>
			</div>
		</div>
	{/if}
{:else}
	<div class="aspect-square w-full max-w-lg mx-auto flex items-center justify-center rounded-lg bg-muted">
		<span class="text-muted-foreground">No image available</span>
	</div>
{/if}
