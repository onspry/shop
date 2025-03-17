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

<section class="flex flex-col gap-8 w-full">
	<Hero />

	<div class="flex justify-center">
		<button
			type="button"
			class="group cursor-pointer p-2 transition-colors hover:text-primary"
			onclick={scrollToFeatures}
			aria-label="Scroll to features"
		>
			<ChevronsDown class="h-10 w-10 animate-bounce transition-transform group-hover:scale-110" />
		</button>
	</div>

	<div id="features" class="w-full pt-8">
		<Carousel opts={{ align: 'start', loop: true }}>
			<CarouselContent class="-ml-2 md:-ml-4">
				{#each features as feature}
					<CarouselItem class="pl-2 md:basis-1/2 lg:basis-1/3 md:pl-4">
						<Card class="h-full bg-card">
							<CardHeader>
								<div class="flex items-start gap-4">
									<svelte:component this={feature.icon} class="h-6 w-6 text-primary" />
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
