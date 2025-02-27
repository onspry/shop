<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
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
	import { Zap, Wrench, Sparkles, ChevronsDown, ChevronRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
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

<section>
	<div class="text-center">
		<h1 class="mb-8 text-4xl font-bold tracking-tight md:text-6xl">{m.keyboard_name()}</h1>

		<div class="mb-12">
			<img
				src="/board.jpeg"
				alt="Split Keyboard"
				class="mx-auto mb-8 rounded-lg shadow-lg"
				width="800"
				height="400"
			/>
			<div class="mt-6 flex justify-center">
				<Button href="/shop" variant="default" size="lg" class="font-semibold">
					Buy Now
					<ChevronRight class="ml-2 h-5 w-5" />
				</Button>
			</div>
		</div>

		<div class="mt-12 flex justify-center">
			<button
				type="button"
				class="group cursor-pointer p-2 transition-colors hover:text-primary"
				on:click={scrollToFeatures}
				aria-label="Scroll to features"
			>
				<ChevronsDown class="h-10 w-10 animate-bounce transition-transform group-hover:scale-110" />
			</button>
		</div>

		<div id="features">
			<div class="mx-auto max-w-5xl px-6">
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
		</div>
	</div>
</section>
