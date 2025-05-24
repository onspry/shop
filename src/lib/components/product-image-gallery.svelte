<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import AppImage from '$lib/components/ui/app-image.svelte';
	import type { ProductImageViewModel } from '$lib/models/product';
	import * as Carousel from '$lib/components/ui/carousel';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { EmblaCarouselType } from 'embla-carousel';
	import * as m from '$lib/paraglide/messages';

	const props = $props<{
		images: ProductImageViewModel[];
	}>();

	// State for carousel API instance
	let emblaApi = $state<EmblaCarouselType | undefined>();

	// Use $state for button disabled status
	let canScrollPrev = $state(false);
	let canScrollNext = $state(false);

	// Effect to update scrollability when API changes or settles
	$effect(() => {
		if (!emblaApi) return;

		const onSelect = () => {
			// Update the state variables
			canScrollPrev = emblaApi?.canScrollPrev() ?? false;
			canScrollNext = emblaApi?.canScrollNext() ?? false;
		};

		emblaApi.on('select', onSelect);
		emblaApi.on('reInit', onSelect);

		// Initial check
		onSelect();

		// Cleanup listener on unmount or when emblaApi changes
		return () => {
			emblaApi?.off('select', onSelect);
			emblaApi?.off('reInit', onSelect);
		};
	});

	// Helper functions to scroll
	function scrollPrev() {
		emblaApi?.scrollPrev();
	}

	function scrollNext() {
		emblaApi?.scrollNext();
	}

	const validImageCount = $derived(props.images?.length || 0);
</script>

{#if validImageCount > 0}
	<div class="relative h-full w-full">
		<Carousel.Root
			class="h-full w-full"
			setApi={(api) => {
				emblaApi = api;
			}}
			opts={{
				loop: true,
				align: 'center'
			}}
		>
			<Carousel.Content class="h-full w-full">
				{#each props.images as image, index (image.id)}
					<Carousel.Item class="flex h-full w-full items-stretch">
						<div class="flex h-full w-full items-stretch overflow-hidden rounded-lg">
							<AppImage
								src={image.url}
								alt={image.alt}
								width="100%"
								height="100%"
								aspectRatio="auto"
								objectFit="cover"
								className="w-full h-full"
							/>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			{#if validImageCount > 1}
				<Carousel.Previous disabled={!canScrollPrev} aria-label="Previous Image" />
				<Carousel.Next disabled={!canScrollNext} aria-label="Next Image" />
			{/if}
		</Carousel.Root>
	</div>
{:else}
	<div
		class="mx-auto flex aspect-square w-full max-w-lg items-center justify-center rounded-lg bg-muted"
	>
		<span class="text-muted-foreground">{m.product_no_image()}</span>
	</div>
{/if}
