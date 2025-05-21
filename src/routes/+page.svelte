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
	class="flex flex-col items-center justify-center bg-white px-4 pb-6 pt-8 text-center dark:bg-neutral-950"
>
	<div class="flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
		<h1 class="mb-4">
			{m.hero_title()}
		</h1>
		<p class="mx-auto mb-6 max-w-md text-lg text-foreground/80">
			{m.hero_description()}
		</p>
		<div class="flex flex-col gap-4 sm:flex-row">
			<Button href={localizeHref('/products')} size="lg" class="px-8">
				{m.hero_cta_shop()}
				<ArrowRight class="ml-2 h-5 w-5" />
			</Button>
			<Button href={localizeHref('/about')} variant="outline" size="lg">{m.hero_cta_learn()}</Button
			>
		</div>
	</div>
	<img
		src="/images/products/zero/main.jpg"
		alt="Featured Keyboard"
		class="mx-auto h-auto w-full max-w-4xl rounded-lg shadow-lg"
	/>
</section>

<!-- Features Section -->
<section class="bg-muted/50 py-16 dark:bg-background">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2>{m.features_title()}</h2>
			<p class="mx-auto mt-4 max-w-xl text-muted-foreground">
				{m.features_subtitle()}
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background p-6 shadow transition-all hover:border-orange-200 hover:shadow-lg dark:hover:border-orange-900"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-primary dark:bg-orange-900"
				>
					<MousePointerClick />
				</div>
				<h3 class="mb-1">{m.feature_ergonomic_title()}</h3>
				<p class="text-center text-muted-foreground">
					{m.feature_ergonomic_desc()}
				</p>
			</div>

			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background p-6 shadow transition-all hover:border-orange-200 hover:shadow-lg dark:hover:border-orange-900"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-primary dark:bg-orange-900"
				>
					<Palette />
				</div>
				<h3 class="mb-1">{m.feature_customizable_title()}</h3>
				<p class="text-center text-muted-foreground">
					{m.feature_customizable_desc()}
				</p>
			</div>

			<div
				class="group flex flex-col items-center rounded-lg border border-muted bg-background p-6 shadow transition-all hover:border-orange-200 hover:shadow-lg dark:hover:border-orange-900"
			>
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-primary dark:bg-orange-900"
				>
					<Leaf />
				</div>
				<h3 class="mb-1">{m.feature_sustainable_title()}</h3>
				<p class="text-center text-muted-foreground">
					{m.feature_sustainable_desc()}
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section class="bg-muted/30 py-16 dark:bg-background/50">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2>{m.testimonial_title()}</h2>
			<p class="mx-auto mt-4 max-w-xl text-muted-foreground">
				{m.testimonial_subtitle()}
			</p>
		</div>

		<div class="mx-auto max-w-2xl">
			<div class="rounded-lg border border-muted bg-background p-8 shadow">
				<div class="mb-6 flex items-center">
					<div class="mr-4 h-16 w-16 overflow-hidden rounded-full">
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
				<blockquote class="text-lg text-muted-foreground">
					"Switching to a split ergonomic keyboard drastically reduced the wrist and shoulder pain I
					experienced from years of heavy typing. While the transition had a learning curve, the
					long-term comfort and posture improvements made it absolutely worth it. I now type more
					mindfully and with significantly less strain."
				</blockquote>
				<div class="mt-4 text-right">
					<a
						href="https://medium.com/@desmond-kh-ip/adopting-a-split-ergonomic-keyboard-to-reduce-keyboard-related-injuries-part-i-cf075e953dfe"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline"
					>
						{m.testimonial_read_more()}
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Featured Products -->
<section class="py-16">
	<div class="mx-auto max-w-screen-xl py-12">
		<h2 class="mb-4 text-center">{m.featured_products_title()}</h2>
		<p class="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
			{m.featured_products_subtitle()}
		</p>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
</style>
