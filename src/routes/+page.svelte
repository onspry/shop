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
	import { Zap, Wrench, Sparkles, ChevronsDown } from 'lucide-svelte/icons';
	import Hero from '$lib/components/hero.svelte';
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	import PriceDisplay from '$lib/components/PriceDisplay.svelte';

	// Get data from page load function
	const { data } = $props();

	// Access featuredProducts from server data
	const { featuredProducts } = data;

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
			title: m.split_design(),
			description: m.split_design_description(),
			icon: Zap
		},
		{
			title: m.customizable(),
			description: m.customizable_description(),
			icon: Wrench
		},
		{
			title: m.handschmeichler(),
			description: m.handschmeichler_description(),
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
					class="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
					onclick={scrollToFeatures}
					onkeydown={(e) => e.key === 'Enter' && scrollToFeatures()}
					role="button"
					tabindex="0"
					aria-label={m.scroll_to_features()}
				>
					<ChevronsDown class="h-12 w-12 animate-bounce" />
				</div>
			</div>

			<div id="features" class="pt-8">
				<Carousel opts={{ align: 'start', loop: true }}>
					<CarouselContent class="-ml-2 md:-ml-4">
						{#each features as feature}
							<CarouselItem class="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3">
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

			<!-- Add product displays with price -->
			<section class="featured-products">
				<h2>{m.home_featured_products()}</h2>
				<div class="product-grid">
					{#each featuredProducts as product}
						<a href="/products/{product.slug}" class="product-card">
							<div class="product-image">
								<img
									src={product.images[0]?.url || '/placeholder.jpg'}
									alt={product.name}
									loading="lazy"
								/>
							</div>
							<div class="product-info">
								<h3 class="product-name">{product.name}</h3>
								<div class="product-price">
									<PriceDisplay price={product.price} />
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		</section>
	</div>
</div>

<style>
	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 2rem;
		margin: 2rem 0;
	}

	.product-card {
		display: block;
		text-decoration: none;
		color: inherit;
		border: 1px solid #eee;
		border-radius: 8px;
		overflow: hidden;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.product-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
	}

	.product-image {
		aspect-ratio: 1 / 1;
		overflow: hidden;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}

	.product-card:hover .product-image img {
		transform: scale(1.05);
	}

	.product-info {
		padding: 1rem;
	}

	.product-name {
		font-size: 1rem;
		margin: 0 0 0.5rem 0;
	}

	.product-price {
		font-weight: bold;
		color: #333;
	}
</style>
