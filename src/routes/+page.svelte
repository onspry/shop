<script lang="ts">
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselNext,
		CarouselPrevious
	} from '$lib/components/ui/carousel';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Zap, Wrench, Sparkles, ChevronsDown } from 'lucide-svelte';
	import Hero from '$lib/components/hero.svelte';
	import { onMount } from 'svelte';

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);

		return () => clearTimeout(timer);
	});

	// Scroll to features function
	function scrollToFeatures() {
		// Delay scrolling by 300ms to allow button animation to play
		setTimeout(() => {
			document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
		}, 300);
	}

	// Key features of the keyboard
	const features = [
		{
			title: 'Split Design',
			description: 'Ergonomic comfort for extended typing sessions',
			icon: Zap
		},
		{
			title: 'Customizable',
			description: 'Hot-swappable switches for your perfect feel',
			icon: Wrench
		},
		{
			title: 'Handschmeichler',
			description: 'Comfort with zero compromise',
			icon: Sparkles
		}
	];
</script>

<div class="min-h-screen bg-background">
	<div
		class="container mx-auto px-4 py-8 transition-opacity duration-500"
		class:opacity-0={!contentVisible}
		class:opacity-100={contentVisible}
	>
		<section class="flex flex-col gap-8">
			<Hero />

			<div class="flex justify-center">
				<div
					class="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
					onclick={scrollToFeatures}
					onkeydown={(e) => e.key === 'Enter' && scrollToFeatures()}
					role="button"
					tabindex="0"
					aria-label="Scroll to features"
				>
					<ChevronsDown class="h-12 w-12 animate-bounce" />
				</div>
			</div>

			<div id="features" class="pt-8">
				<Carousel opts={{ align: 'start', loop: true }}>
					<CarouselContent class="-ml-2 md:-ml-4">
						{#each features as feature}
							<CarouselItem class="pl-2 md:basis-1/2 lg:basis-1/3 md:pl-4">
								<Card class="h-full bg-card">
									<CardHeader>
										<div class="flex items-start gap-4">
											<CardTitle class="text-xl font-semibold">{feature.title}</CardTitle>
										</div>
									</CardHeader>
									<CardContent>
										<CardDescription class="text-base">{feature.description}</CardDescription>
									</CardContent>
								</Card>
							</CarouselItem>
						{/each}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>
		</section>
	</div>
</div>
