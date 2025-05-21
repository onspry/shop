<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, MousePointerClick, Palette, Leaf } from 'lucide-svelte';
	import ProductCard from '$lib/components/product-card.svelte';
	import type { ProductViewModel } from '$lib/models/product';
	import { localizeHref } from '$lib/paraglide/runtime';

	export let data: { products: ProductViewModel[] };
	let products = data.products;
</script>

<!-- Hero Section -->
<section
	class="relative flex flex-col items-center justify-center bg-white px-4 pb-6 pt-8 text-center dark:bg-neutral-950"
>
	<div class="flex flex-col items-center justify-center px-4 py-12 text-center md:py-20">
		<h1 class="animate-fade-in mb-3 text-4xl md:text-5xl">
			{m.hero_title()}
		</h1>
		<p
			class="animate-fade-in mx-auto mb-8 max-w-2xl text-lg text-foreground/80 [animation-delay:200ms] md:text-xl"
		>
			{m.hero_description()}
		</p>
		<div class="animate-fade-in flex flex-col gap-3 [animation-delay:400ms] sm:flex-row">
			<Button href={localizeHref('/products')} size="lg" class="px-8">
				{m.hero_cta_shop()}
				<ArrowRight class="ml-2 h-5 w-5" />
			</Button>
			<Button href={localizeHref('/about')} variant="outline" size="lg">{m.hero_cta_learn()}</Button
			>
		</div>
	</div>
	<div class="relative w-full">
		<div
			class="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 dark:to-background/40"
		></div>
		<img
			src="/images/products/zero/main.jpg"
			alt="Featured Keyboard"
			class="mx-auto h-auto w-full max-w-6xl rounded-lg shadow-lg transition-transform duration-300 hover:scale-[1.02]"
		/>
	</div>
</section>

<!-- Features Section -->
<section class="relative bg-muted/50 py-12 dark:bg-background">
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#404040_1px,transparent_1px)]"
	></div>
	<div class="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 text-center">
			<h2 class="text-3xl md:text-4xl">{m.features_title()}</h2>
			<p class="mx-auto mt-3 max-w-xl text-muted-foreground">
				{m.features_subtitle()}
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background/80 p-5 shadow backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg dark:bg-background/80 dark:hover:border-orange-900"
			>
				<div
					class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-primary transition-colors group-hover:bg-orange-200 dark:bg-orange-900 dark:group-hover:bg-orange-800"
				>
					<MousePointerClick class="h-5 w-5" />
				</div>
				<h3 class="mb-2 text-lg font-medium">{m.feature_ergonomic_title()}</h3>
				<p class="text-center text-sm text-muted-foreground">
					{m.feature_ergonomic_desc()}
				</p>
			</div>

			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background/80 p-5 shadow backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg dark:bg-background/80 dark:hover:border-orange-900"
			>
				<div
					class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-primary transition-colors group-hover:bg-orange-200 dark:bg-orange-900 dark:group-hover:bg-orange-800"
				>
					<Palette class="h-5 w-5" />
				</div>
				<h3 class="mb-2 text-lg font-medium">{m.feature_customizable_title()}</h3>
				<p class="text-center text-sm text-muted-foreground">
					{m.feature_customizable_desc()}
				</p>
			</div>

			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background/80 p-5 shadow backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg dark:bg-background/80 dark:hover:border-orange-900"
			>
				<div
					class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-primary transition-colors group-hover:bg-orange-200 dark:bg-orange-900 dark:group-hover:bg-orange-800"
				>
					<Leaf class="h-5 w-5" />
				</div>
				<h3 class="mb-2 text-lg font-medium">{m.feature_sustainable_title()}</h3>
				<p class="text-center text-sm text-muted-foreground">
					{m.feature_sustainable_desc()}
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section class="bg-muted/30 py-12 dark:bg-background/50">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 text-center">
			<h2 class="text-3xl md:text-4xl">{m.testimonial_title()}</h2>
			<p class="mx-auto mt-3 max-w-xl text-muted-foreground">
				{m.testimonial_subtitle()}
			</p>
		</div>

		<div class="mx-auto max-w-2xl">
			<div
				class="group rounded-lg border border-muted bg-background p-6 shadow transition-all hover:shadow-lg"
			>
				<div class="mb-4 flex items-center">
					<div
						class="mr-4 h-12 w-12 overflow-hidden rounded-full ring-2 ring-orange-200 transition-all group-hover:ring-orange-300 dark:ring-orange-800 dark:group-hover:ring-orange-700"
					>
						<img
							src="/images/testimonials/desmond.jpg"
							alt="Desmond KH Ip"
							class="h-full w-full object-cover"
						/>
					</div>
					<div>
						<h3 class="font-medium">Desmond KH Ip</h3>
						<p class="text-sm text-muted-foreground">Software Developer</p>
					</div>
				</div>
				<div class="relative">
					<svg
						class="absolute -left-2 -top-2 h-8 w-8 text-orange-200/50 dark:text-orange-800/50"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"
						/>
					</svg>
					<blockquote class="relative pl-6 text-base text-muted-foreground">
						"Switching to a split ergonomic keyboard drastically reduced the wrist and shoulder pain
						I experienced from years of heavy typing. While the transition had a learning curve, the
						long-term comfort and posture improvements made it absolutely worth it. I now type more
						mindfully and with significantly less strain."
					</blockquote>
				</div>
				<div class="mt-4 text-right">
					<a
						href="https://medium.com/@desmond-kh-ip/adopting-a-split-ergonomic-keyboard-to-reduce-keyboard-related-injuries-part-i-cf075e953dfe"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center text-sm text-primary transition-colors hover:text-orange-600 dark:hover:text-orange-400"
					>
						{m.testimonial_read_more()}
						<ArrowRight class="ml-1 h-4 w-4" />
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Featured Products -->
<section class="py-12">
	<div class="mx-auto max-w-screen-xl">
		<h2 class="mb-3 text-center text-3xl md:text-4xl">{m.featured_products_title()}</h2>
		<p class="mx-auto mb-8 max-w-xl text-center text-muted-foreground">
			{m.featured_products_subtitle()}
		</p>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each products as product}
				<ProductCard {product} />
			{/each}
		</div>
	</div>
</section>

<style>
	/* Hide scrollbars for horizontal carousel on mobile */
	::-webkit-scrollbar {
		display: none;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out forwards;
	}
</style>
